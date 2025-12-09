import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  GraduationCap, 
  Building2, 
  Users, 
  ArrowRight,

  Linkedin,
  Facebook,
  Twitter,
  Briefcase,
  Award,
  Target,
  Zap,
  Shield,
  Clock,
  BarChart3
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
      description: 'Complete profile, track applications, and access placement opportunities',
      color: 'indigo'
    },
    {
      icon: Building2,
      title: 'Company Portal',
      description: 'Post job opportunities, review applications, and connect with top talent',
      color: 'purple'
    },
    {
      icon: Users,
      title: 'TPO Management',
      description: 'Oversee placement activities, post internships, and manage student applications',
      color: 'emerald'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Track placement statistics, success rates, and comprehensive reports',
      color: 'pink'
    }
  ];



  const benefits = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Quick application processing'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is protected'
    },
    {
      icon: Clock,
      title: '24/7 Support',
      description: 'Round-the-clock assistance'
    },
    {
      icon: Target,
      title: 'High Success Rate',
      description: '95% placement success'
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
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Glow Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent-purple/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-accent-pink/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
                <span className="text-gradient-premium">
                  Welcome to Campus
                </span>
                <br />
                <span className="text-white">
                  Placement Portal
                </span>
              </h1>
            </motion.div>

            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed"
            >
              Empowering students, connecting companies, and streamlining placements for a brighter future.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              {user ? (
                <Link to={getDashboardLink()}>
                  <button className="btn-primary group">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5 inline-block group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <button className="btn-primary group">
                      Get Started Today
                      <ArrowRight className="ml-2 h-5 w-5 inline-block group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                  <button className="btn-secondary">
                    Learn More
                  </button>
                </>
              )}
            </motion.div>

            {/* Hero Cards */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
            >
              {[
                { icon: Award, label: 'Premium Quality', value: '5★ Rated' },
                { icon: Target, label: 'Success Rate', value: '95%' },
                { icon: Briefcase, label: 'Active Drives', value: '100+' }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="glass-card p-6 animate-float"
                  style={{ animationDelay: `${index * 0.5}s` }}
                >
                  <item.icon className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-white mb-1">{item.value}</div>
                  <div className="text-sm text-gray-400">{item.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>
      {/* Stats Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Trusted by <span className="text-gradient-premium">Thousands</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Our platform has successfully connected students with their dream careers
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="glass-card p-6 hover:scale-[1.02] transition-transform duration-300"
              >
                <div className="text-4xl md:text-5xl font-extrabold text-gradient-premium mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-400 text-sm font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Benefits Row */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -5 }}
                className="text-center group"
              >
                <div className="w-12 h-12 mx-auto mb-3 bg-indigo-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <benefit.icon className="w-6 h-6 text-indigo-400" />
                </div>
                <h4 className="font-semibold text-white mb-1 text-sm">
                  {benefit.title}
                </h4>
                <p className="text-xs text-gray-500">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      {/* Features Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-white">Why Choose Our </span>
              <span className="text-gradient-premium">Portal?</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Everything you need for a seamless campus placement experience, powered by modern technology.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const colorClasses = {
                indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', gradient: 'from-indigo-500 to-indigo-600' },
                purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', gradient: 'from-purple-500 to-purple-600' },
                emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', gradient: 'from-emerald-500 to-emerald-600' },
                pink: { bg: 'bg-pink-500/10', text: 'text-pink-400', gradient: 'from-pink-500 to-pink-600' }
              }[feature.color as 'indigo' | 'purple' | 'emerald' | 'pink']!;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="glass-card p-8 group"
                >
                  <div className={`w-16 h-16 ${colorClasses.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-8 h-8 ${colorClasses.text}`} />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-4">
                    {feature.title}
                  </h3>

                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>

                  <div className={`mt-6 h-1 w-0 group-hover:w-full bg-gradient-to-r ${colorClasses.gradient} transition-all duration-500 rounded-full`} />
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center mt-16"
          >
            <p className="text-lg text-gray-400 mb-8">
              Ready to experience the future of campus placements?
            </p>
            <button className="btn-secondary group">
              Explore All Features
              <ArrowRight className="ml-2 w-5 h-5 inline-block group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Career Journey?
            </h2>
            
            <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of students and companies who trust our platform for campus placements.
            </p>
            
            <Link to={user ? getDashboardLink() : '/login'}>
              <button className="btn-primary text-lg">
                {user ? 'Go to Dashboard' : 'Get Started Today'}
                <ArrowRight className="ml-2 h-5 w-5 inline-block" />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>
      {/* Footer */}
      <footer className="relative py-12 overflow-hidden border-t border-white/5">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            {/* Brand Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex items-center space-x-3"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gradient-premium">
                  Placement Cell
                </h3>
                <p className="text-gray-500 text-sm">Connecting Dreams with Opportunities</p>
              </div>
            </motion.div>

            {/* Social Links */}
            <motion.div 
              className="flex space-x-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {[
                { icon: Linkedin, label: 'LinkedIn' },
                { icon: Facebook, label: 'Facebook' },
                { icon: Twitter, label: 'Twitter' }
              ].map((social, index) => (
                <motion.a
                  key={index}
                  href="#"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 bg-glass-100 backdrop-blur-md rounded-lg flex items-center justify-center text-gray-400 hover:text-indigo-400 hover:bg-glass-200 transition-all duration-200"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </motion.div>

            {/* Copyright */}
            <motion.div 
              className="text-gray-500 text-sm text-center md:text-right"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <p>&copy; {new Date().getFullYear()} Placement Cell. All rights reserved.</p>
            </motion.div>
          </div>
        </div>
      </footer>
    </div>
  );
};