import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiCamera, FiCheck, FiImage, FiRefreshCw, FiShield, FiSun, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { useColorProfile } from '../context/ColorProfileContext.jsx';
import api, { getErrorMessage } from '../services/api.js';
import { PageSpinner } from '../components/Feedback.jsx';
import { analyzeFaceCanvas, fitCanvas } from '../utils/colorEngine/sampling.js';
import { getPalette } from '../utils/colorEngine/index.js';

const SESSION_RESULT_KEY = 'make-mi_color_result';
const resultProfile = (profile) => ({ skinDepth: profile.skinDepth, undertone: profile.undertone, palette: (profile.palette || []).map(({ name, hex }) => ({ name, hex })) });
const signature = (profile) => JSON.stringify(resultProfile(profile));

export default function ColorMatchPage() {
  const { isAuthenticated } = useAuth();
  const { colorProfile, setColorProfile, loading: profileLoading } = useColorProfile();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);
  const modelPromise = useRef(null);
  const persisted = useRef('');
  const mounted = useRef(true);
  const [stage, setStage] = useState('intro');
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState('');
  const [consentOpen, setConsentOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [analysisError, setAnalysisError] = useState('');
  const [result, setResult] = useState(null);
  const [thumbnail, setThumbnail] = useState('');
  const [saving, setSaving] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; stopCamera(); };
  }, [stopCamera]);

  useEffect(() => {
    let active = true;
    modelPromise.current = import('@vladmandic/face-api').then((faceapi) => Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models'),
    ]));
    modelPromise.current.then(() => {
      if (active) { setModelsLoading(false); setModelsError(''); }
    }).catch(() => {
      if (active) { setModelsLoading(false); setModelsError('We could not load the on-device face models. Check that the local files in /models are available, then reload this page.'); }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(SESSION_RESULT_KEY) || 'null');
      if (stored?.skinDepth && stored?.undertone && Array.isArray(stored.palette)) {
        const suggestions = getPalette(stored.skinDepth, stored.undertone);
        const saved = { ...resultProfile(stored), ...suggestions, skinToneHex: null, warnings: [] };
        setResult(saved);
        setColorProfile(resultProfile(saved));
        setStage('result');
      }
    } catch {
      sessionStorage.removeItem(SESSION_RESULT_KEY);
    }
  }, [setColorProfile]);

  useEffect(() => {
    if (stage !== 'intro' || sessionStorage.getItem(SESSION_RESULT_KEY) || !colorProfile?.palette?.length) return;
    const suggestions = getPalette(colorProfile.skinDepth, colorProfile.undertone);
    if (!suggestions) return;
    const profile = resultProfile(colorProfile);
    persisted.current = signature(profile);
    setResult({ ...profile, ...suggestions, skinToneHex: null, warnings: [] });
    setStage('result');
  }, [colorProfile, stage]);

  const persistProfile = useCallback(async (profile, { manual = false } = {}) => {
    if (!isAuthenticated) {
      if (manual) {
        toast('Sign in to save your color profile. Your result stays available for this session.');
        navigate('/login', { state: { from: { pathname: '/color-match' } } });
      }
      return false;
    }
    const payload = resultProfile(profile);
    const key = signature(payload);
    if (persisted.current === key) return true;
    persisted.current = key;
    setSaving(true);
    try {
      const response = await api.post('/users/color-profile', payload);
      const stored = response.data?.data || payload;
      setColorProfile(stored);
      sessionStorage.setItem(SESSION_RESULT_KEY, JSON.stringify(payload));
      toast.success('Your color profile is saved.');
      return true;
    } catch (error) {
      persisted.current = '';
      toast.error(getErrorMessage(error, 'Could not save your color profile. Your result is still available in this session.'));
      return false;
    } finally {
      setSaving(false);
    }
  }, [isAuthenticated, navigate, setColorProfile]);

  useEffect(() => {
    if (!isAuthenticated || profileLoading || !result?.palette?.length) return;
    persistProfile(result);
  }, [isAuthenticated, profileLoading, result, persistProfile]);

  const showResult = useCallback((analysis) => {
    if (analysis.error) {
      setAnalysisError(analysis.error);
      setStage('retry');
      return;
    }
    const suggestion = getPalette(analysis.profile.skinDepth, analysis.profile.undertone);
    const completed = { ...analysis.profile, palette: suggestion.bestColors, avoidColors: suggestion.avoidColors, stylingTip: suggestion.stylingTip, skinToneHex: analysis.skinToneHex, warnings: analysis.warnings };
    setResult(completed);
    setThumbnail(canvasRef.current?.toDataURL('image/jpeg', 0.82) || '');
    sessionStorage.setItem(SESSION_RESULT_KEY, JSON.stringify(resultProfile(completed)));
    setColorProfile(resultProfile(completed));
    setAnalysisError('');
    setStage('result');
  }, [setColorProfile]);

  const analyzeCanvas = useCallback(async () => {
    setStage('analyzing');
    setAnalysisError('');
    if (!modelPromise.current || modelsError) {
      setAnalysisError(modelsError || 'The face models are still loading. Please try again in a moment.');
      setStage('retry');
      return;
    }
    try {
      await modelPromise.current;
      const analysis = await analyzeFaceCanvas(canvasRef.current);
      showResult(analysis);
    } catch (error) {
      setAnalysisError(getErrorMessage(error, 'We could not analyze this photo. Try another photo in natural light.'));
      setStage('retry');
    }
  }, [modelsError, showResult]);

  const startCamera = async () => {
    setConsentOpen(false);
    setCameraError('');
    if (!window.isSecureContext && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
      setCameraError('Camera access requires a secure page (HTTPS). You can still upload a photo instead.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('This browser does not support camera access. You can upload a photo instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      if (!mounted.current) { stream.getTracks().forEach((track) => track.stop()); return; }
      streamRef.current = stream;
      setStage('camera');
      requestAnimationFrame(async () => {
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        try { await videoRef.current.play(); } catch { setCameraError('The camera preview could not start. Check browser camera permission or upload a photo instead.'); }
      });
    } catch (error) {
      if (error.name === 'NotAllowedError' || error.name === 'SecurityError') setCameraError('Camera permission was denied. Allow camera access in your browser settings, or upload a photo instead.');
      else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') setCameraError('No camera was found on this device. You can upload a photo instead.');
      else setCameraError('The camera could not be opened. Check that it is not being used by another app, or upload a photo instead.');
      setStage('intro');
    }
  };

  const captureCamera = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) { setCameraError('The camera is not ready yet. Please wait a moment and try again.'); return; }
    try {
      fitCanvas(canvasRef.current, video);
      stopCamera();
      await analyzeCanvas();
    } catch {
      stopCamera();
      setAnalysisError('The camera frame could not be captured. Please try again or upload a photo.');
      setStage('retry');
    }
  };

  const chooseUpload = () => fileRef.current?.click();
  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setAnalysisError('Choose a JPEG, PNG, or WebP image to continue.'); setStage('retry'); return; }
    if (file.size > 20 * 1024 * 1024) { setAnalysisError('That photo is larger than 20 MB. Choose a smaller image.'); setStage('retry'); return; }
    stopCamera();
    setAnalysisError('');
    setStage('analyzing');
    const objectUrl = URL.createObjectURL(file);
    try {
      const image = new Image();
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = objectUrl; });
      fitCanvas(canvasRef.current, image);
      await analyzeCanvas();
    } catch {
      setAnalysisError('That image could not be opened. Choose a different photo.');
      setStage('retry');
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  const retake = () => {
    stopCamera();
    setResult(null);
    setThumbnail('');
    setAnalysisError('');
    setCameraError('');
    sessionStorage.removeItem(SESSION_RESULT_KEY);
    if (!isAuthenticated) setColorProfile(null);
    setStage('intro');
  };

  const deleteProfile = async () => {
    if (!window.confirm('Delete your saved color profile?')) return;
    try {
      await api.delete('/users/color-profile');
      persisted.current = '';
      setColorProfile(null);
      sessionStorage.removeItem(SESSION_RESULT_KEY);
      toast.success('Your saved color profile was deleted.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not delete your color profile.'));
    }
  };

  const saved = Boolean(isAuthenticated && colorProfile && result && signature(colorProfile) === signature(result));
  const shopProfile = result?.palette?.length ? result : colorProfile;
  const shopColors = shopProfile?.palette?.map(({ hex }) => hex).filter(Boolean) || [];
  const shopAvoidColors = shopProfile?.avoidColors?.map(({ hex }) => hex).filter(Boolean)
    || getPalette(shopProfile?.skinDepth, shopProfile?.undertone)?.avoidColors?.map(({ hex }) => hex).filter(Boolean)
    || [];
  const shopQuery = new URLSearchParams({ matchColors: shopColors.join(','), avoidColors: shopAvoidColors.join(','), matchColorNames: shopProfile?.palette?.map(({ name }) => name).filter(Boolean).join(',') || '', avoidColorNames: shopProfile?.avoidColors?.map(({ name }) => name).filter(Boolean).join(',') || getPalette(shopProfile?.skinDepth, shopProfile?.undertone)?.avoidColors?.map(({ name }) => name).filter(Boolean).join(',') || '' });

  return <main className="page-enter mx-auto max-w-5xl px-4 py-8 sm:py-10">
    <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} aria-label="Choose a photo to analyze" />
    {stage === 'intro' && <section className="rounded-3xl bg-white p-6 shadow-soft sm:p-10">
      <div className="mx-auto max-w-2xl text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-100 text-amber-800"><FiSun size={30}/></span><p className="mt-5 text-xs font-bold uppercase tracking-[.18em] text-amber-700">Personal color suggestions</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Make MI Color Match</h1><p className="mt-4 leading-7 text-slate-600">Get a suggested color palette based on a photo of your face. Your photo is analyzed on this device and is never uploaded or saved.</p>
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-sky-100 bg-sky-50 p-4 text-left"><FiShield className="mt-0.5 shrink-0 text-sky-700"/><p className="text-sm leading-6 text-sky-900"><strong>Private by design.</strong> Make MI does not upload or store your photo. If you choose to save, only your skin depth, undertone, and suggested palette are sent to your account.</p></div>
        {modelsLoading ? <div className="mt-6"><PageSpinner label="Loading on-device color toolsâ€¦"/></div> : modelsError && <p role="alert" className="mt-5 rounded-lg bg-rose-50 p-3 text-left text-sm text-rose-800">{modelsError}</p>}
        {cameraError && <p role="alert" className="mt-5 rounded-lg bg-rose-50 p-3 text-left text-sm text-rose-800">{cameraError}</p>}
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><button disabled={modelsLoading || Boolean(modelsError)} onClick={() => setConsentOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber px-5 py-3 font-bold text-navy disabled:cursor-wait disabled:opacity-60"><FiCamera/>Start camera</button><button onClick={chooseUpload} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 font-bold text-slate-800 hover:bg-slate-50"><FiImage/>Upload a photo instead</button></div>
        {!isAuthenticated && <p className="mt-4 text-sm text-slate-500">You can view results without an account. Sign in only if you want to save your palette.</p>}
      </div>
    </section>}

    {stage === 'camera' && <section className="mx-auto max-w-xl rounded-2xl bg-white p-5 shadow-soft sm:p-7"><h1 className="text-2xl font-black">Position your face</h1><p className="mt-2 text-sm text-slate-600">Face a window or natural light. Avoid filters, heavy makeup, and strong colored light.</p><div className="relative mt-5 aspect-[4/3] overflow-hidden rounded-2xl bg-slate-950"><video ref={videoRef} muted playsInline className="h-full w-full -scale-x-100 object-cover" aria-label="Live camera preview"/><div className="pointer-events-none absolute inset-0 grid place-items-center"><div className="h-[78%] w-[58%] rounded-[50%] border-2 border-dashed border-white/90 shadow-[0_0_0_999px_rgba(15,23,42,0.18)]"/></div></div>{cameraError&&<p role="alert" className="mt-3 text-sm text-rose-700">{cameraError}</p>}<div className="mt-5 flex flex-wrap gap-3"><button onClick={captureCamera} disabled={modelsLoading||Boolean(modelsError)} className="inline-flex items-center gap-2 rounded-lg bg-amber px-5 py-3 font-bold text-navy disabled:opacity-50"><FiCamera/>Capture</button><button onClick={()=>{stopCamera();setStage('intro')}} className="rounded-lg border px-5 py-3 font-semibold">Cancel</button><button onClick={()=>{stopCamera();chooseUpload()}} className="ml-auto inline-flex items-center gap-2 px-2 py-3 text-sm font-semibold text-sky-700"><FiImage/>Upload instead</button></div></section>}

    {stage === 'analyzing' && <section className="rounded-2xl bg-white p-8 text-center shadow-soft"><PageSpinner label="Analyzing your photo on this deviceâ€¦"/><p className="mt-2 text-sm text-slate-500">Your image stays in your browser and is never sent to our server.</p></section>}

    {stage === 'retry' && <section className="mx-auto max-w-xl rounded-2xl bg-white p-7 text-center shadow-soft"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-amber-50 text-amber-700"><FiRefreshCw size={22}/></span><h1 className="mt-4 text-2xl font-black">Letâ€™s try that again</h1><p role="alert" className="mt-3 text-sm leading-6 text-slate-600">{analysisError || modelsError || 'We could not analyze that image.'}</p>{modelsError&&<p className="mt-2 text-xs text-slate-500">The local model files must be available at <code>/models</code>.</p>}<div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={()=>setConsentOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber px-5 py-3 font-bold text-navy"><FiCamera/>Try camera again</button><button onClick={chooseUpload} className="inline-flex items-center justify-center gap-2 rounded-lg border px-5 py-3 font-bold"><FiImage/>Choose another photo</button></div><button onClick={retake} className="mt-4 text-sm font-semibold text-slate-500 hover:text-slate-800">Back to intro</button></section>}

    {stage === 'result' && result && <section>
      <div className="mb-6"><p className="text-xs font-bold uppercase tracking-[.18em] text-amber-700">Your personal palette</p><h1 className="mt-1 text-3xl font-black">Your color match</h1></div>
      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]"><aside className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="font-bold">Your photo</h2>{thumbnail?<img src={thumbnail} alt="In-memory photo used for this color suggestion" className="mt-3 aspect-[4/5] w-full rounded-xl bg-slate-100 object-cover"/>:<div className="mt-3 grid aspect-[4/5] place-items-center rounded-xl bg-slate-100 p-4 text-center text-sm text-slate-500">The photo preview is only kept in memory. It is not stored with your profile.</div>}<p className="mt-4 flex items-center gap-3 text-sm"><span className={`h-9 w-9 rounded-full border border-black/10 ${result.skinToneHex?'':'bg-slate-200'}`} style={result.skinToneHex?{backgroundColor:result.skinToneHex}:undefined}/><span>{result.skinToneHex?'Detected skin tone':'Sample not retained'}</span></p><p className="mt-4 text-sm text-slate-600">Depth: <strong className="capitalize text-slate-900">{result.skinDepth}</strong><br/>Undertone: <strong className="capitalize text-slate-900">{result.undertone}</strong></p></aside>
        <div className="space-y-5"><section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-black">Best colors for you</h2>{saved&&<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"><FiCheck/>Saved</span>}</div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{result.palette.map((swatch)=><div key={`${swatch.name}-${swatch.hex}`} className="overflow-hidden rounded-xl border border-slate-200"><span className="block h-16" style={{backgroundColor:swatch.hex}}/><div className="p-2"><p className="text-sm font-semibold">{swatch.name}</p><code className="text-xs text-slate-500">{swatch.hex}</code></div></div>)}</div>{result.stylingTip&&<p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-950"><strong>Styling tip:</strong> {result.stylingTip}</p>}</section>
          <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-black">Colors to avoid</h2><div className="mt-3 flex flex-wrap gap-2">{result.avoidColors?.map((swatch)=><span key={swatch.name} className="inline-flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 text-sm"><span className="h-7 w-7 rounded-full border border-black/10" style={{backgroundColor:swatch.hex}}/>{swatch.name}</span>)}</div></section>
          {result.warnings?.map((warning)=><p key={warning} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{warning}</p>)}
          <p className="text-xs leading-5 text-slate-500">Style suggestions only. Results depend on lighting, camera settings, and the photo; they are not a scientific or medical assessment.</p>
          <div className="flex flex-wrap gap-3"><Link to={`/products?${shopQuery.toString()}`} className="rounded-lg bg-amber px-5 py-3 text-sm font-bold text-navy">Shop these colors</Link><button onClick={retake} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-bold"><FiRefreshCw/>Retake</button><button disabled={saving||saved} onClick={()=>persistProfile(result,{manual:true})} className="rounded-lg bg-navy px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{saving?'Savingâ€¦':saved?'Saved to my profile':'Save to my profile'}</button>{isAuthenticated&&colorProfile&&<button onClick={deleteProfile} className="inline-flex items-center gap-2 px-2 py-3 text-sm font-semibold text-rose-700"><FiTrash2/>Delete my color profile</button>}</div>
        </div>
      </div>
    </section>}

    {consentOpen&&<div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/60 p-4" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="camera-consent-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700"><FiShield/></span><div><h2 id="camera-consent-title" className="text-xl font-black">Before you start</h2><p className="mt-2 text-sm leading-6 text-slate-600">With your permission, the camera image is analyzed only in this browser. Make MI never uploads or saves your photo. Camera access stops immediately after capture or when you leave.</p></div></div><div className="mt-6 flex justify-end gap-3"><button onClick={()=>setConsentOpen(false)} className="rounded-lg border px-4 py-2.5 font-semibold">Cancel</button><button onClick={startCamera} className="rounded-lg bg-amber px-4 py-2.5 font-bold text-navy">I agree, open camera</button></div></section></div>}
  </main>;
}


