// components/Footer.tsx
import { FaFacebook, FaInstagram, FaTiktok } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white p-4 mt-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
        <div>&copy; 2025 SoukStyle</div>
        <div className="flex space-x-4">
          <a href="#">About</a>
          <a href="#">Contact</a>
          <a href="#">Terms</a>
        </div>
        <div className="flex space-x-4">
          <FaFacebook />
          <FaInstagram />
          <FaTiktok />
        </div>
      </div>
    </footer>
  );
}