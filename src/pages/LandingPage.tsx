import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  GraduationCap, 
  Building2, 
  Users, 
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Star,
  Globe,
  Linkedin,
  Facebook,
  Twitter
} from 'lucide-react';
import { Navbar } from '../components/common/Navbar';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

export const LandingPage: React.FC = () => {
  const { user } = useAuthStore();
  const { isDarkMode } = useThemeStore();

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const features = [
    {
      icon: GraduationCap,
      title: 'Student Portal',
      description: 'Complete profile, track applications, and access placement opportunities'
    },
    {
      icon: Building2,
      title: 'TPO Management',
      description: 'Oversee placement activities, post internships, and manage student applications'
    },
    {
      icon: Users,
      title: 'TPO Management',
      description: 'Oversee placement activities, post internships, and manage student applications'
    },
    {
      icon: TrendingUp,
      title: 'Analytics Dashboard',
      description: 'Track placement statistics, success rates, and comprehensive reports'
    }
  ];

  const stats = [
    { number: '5000+', label: 'Students Placed' },
    { number: '500+', label: 'Companies' },
    { number: '95%', label: 'Success Rate' },
    { number: '100+', label: 'Job Drives' }
  ];

  const getDashboardLink = () => {
    switch (user?.role) {
      case 'admin': return '/admin/dashboard';
      case 'tpo': return '/tpo/dashboard';

      case 'student': return '/student/dashboard';
      default: return '/';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />
      {/* Hero Section */}
      <section className="relative pt-24 pb-40 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Animated SVG Wave */}
        <div className="absolute inset-0 pointer-events-none">
          <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-40 text-blue-200 dark:text-blue-900">
            <path fill="currentColor" fillOpacity="1" d="M0,160L60,170.7C120,181,240,203,360,197.3C480,192,600,160,720,154.7C840,149,960,171,1080,181.3C1200,192,1320,192,1380,192L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
          </svg>
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-10"
          >
            <h1 className="text-5xl md:text-7xl font-extrabold text-blue-900 dark:text-white mb-6 leading-tight">
              Welcome to <span className="text-blue-600 dark:text-blue-400">Campus Placement Portal</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-8">
              Empowering students, connecting companies, and streamlining placements for a brighter future.
            </p>
            {user ? (
              <Link
                to={getDashboardLink()}
                className="group relative inline-flex items-center justify-center px-12 py-5 text-xl font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 rounded-2xl hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="group relative inline-flex items-center justify-center px-12 py-5 text-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Login
              </Link>
            )}
          </motion.div>
        </div>
      </section>
      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-6 shadow-md flex flex-col items-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-700 dark:text-gray-200 text-lg font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-blue-900 dark:text-white mb-4">
              Why Choose Our Portal?
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need for a seamless campus placement experience.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-blue-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80')] bg-cover bg-center"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Career Journey?
            </h2>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of students and companies who trust our platform for their campus placement needs.
            </p>
            <Link
              to={user ? getDashboardLink() : '/login'}
              className="inline-flex items-center justify-center px-10 py-4 text-lg font-semibold text-white bg-gradient-to-r from-green-500 to-blue-600 rounded-xl hover:from-green-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {user ? 'Go to Dashboard' : 'Get Started Today'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <GraduationCap className="h-8 w-8 text-blue-400" />
            <span className="text-xl font-bold">Placement Cell</span>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-blue-400"><Linkedin className="w-6 h-6" /></a>
            <a href="#" className="hover:text-blue-400"><Facebook className="w-6 h-6" /></a>
            <a href="#" className="hover:text-blue-400"><Twitter className="w-6 h-6" /></a>
          </div>
          <div className="text-gray-400 text-sm">&copy; {new Date().getFullYear()} Placement Cell. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};