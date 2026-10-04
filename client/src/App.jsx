import { Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { ProtectedRoute, AdminRoute } from './routes/RouteGuards.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import { NotFoundPage } from './pages/PlaceholderPage.jsx';
import ColorMatchPage from './pages/ColorMatchPage.jsx';
import { PageSpinner } from './components/Feedback.jsx';
import HomePage from './pages/HomePage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import CartPage from './pages/CartPage.jsx';
import WishlistPage from './pages/WishlistPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import OrderDetailPage from './pages/OrderDetailPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import AdminProductsPage from './pages/AdminProductsPage.jsx';
import AdminOrdersPage from './pages/AdminOrdersPage.jsx';
import AdminUsersPage from './pages/AdminUsersPage.jsx';

export default function App() {
  const { authReady } = useAuth();
  if (!authReady) return <div className="flex min-h-screen flex-col"><Navbar/><main className="flex-1"><PageSpinner/></main><Footer/></div>;
  return <div className="flex min-h-screen flex-col"><Navbar/><main className="flex-1"><ErrorBoundary><Routes>
    <Route path="/" element={<HomePage/>}/><Route path="/login" element={<LoginPage/>}/><Route path="/register" element={<RegisterPage/>}/>
    <Route path="/cart" element={<CartPage/>}/>
    <Route element={<ProtectedRoute/>}><Route path="/profile" element={<ProfilePage/>}/><Route path="/wishlist" element={<WishlistPage/>}/><Route path="/checkout" element={<CheckoutPage/>}/><Route path="/orders" element={<OrdersPage/>}/><Route path="/orders/:id" element={<OrderDetailPage/>}/></Route>
    <Route path="/admin" element={<AdminRoute/>}><Route element={<AdminLayout/>}><Route index element={<AdminDashboardPage/>}/><Route path="products" element={<AdminProductsPage/>}/><Route path="orders" element={<AdminOrdersPage/>}/><Route path="users" element={<AdminUsersPage/>}/></Route></Route>
    <Route path="/products" element={<ProductsPage/>}/><Route path="/product/:id" element={<ProductDetailPage/>}/><Route path="/color-match" element={<ColorMatchPage/>}/><Route path="/404" element={<NotFoundPage/>}/><Route path="*" element={<NotFoundPage/>}/>
  </Routes></ErrorBoundary></main><Footer/></div>;
}
