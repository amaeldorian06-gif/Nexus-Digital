'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalService, setModalService] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const faqs = [
    {
      question: "Comment fonctionnent les cartes NFC ?",
      answer: "Elles utilisent la technologie de communication en champ proche pour transmettre instantanément vos coordonnées à n'importe quel smartphone moderne, sans application requise."
    },
    {
      question: "Quel est le délai de livraison ?",
      answer: "Nos sites web premium sont généralement livrés sous 2 à 4 semaines. Les cartes NFC sont expédiées sous 48h après validation du design."
    },
    {
      question: "Les QR codes sont-ils modifiables ?",
      answer: "Oui, nos QR codes sont dynamiques. Vous pouvez modifier le lien de destination à tout moment depuis votre tableau de bord sans avoir à réimprimer le code."
    }
  ];

  // Handle Toast timeout
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Handle Loading screen
  useEffect(() => {
    setIsMounted(true);
    // Prevent scrolling while loading
    if (isLoading) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  const showToast = (message: string) => {
    setToastMessage(message);
  };

  const handleOpenModal = (service: string = '') => {
    setModalService(service);
    setIsModalOpen(true);
    setSubmitSuccess(false);
    setSubmitError('');
  };

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const service = formData.get('service') as string;
    const message = formData.get('message') as string;

    // Validation
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Le nom est requis';
    if (!email.trim()) {
      errors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Email invalide';
    }
    if (!service) errors.service = 'Veuillez choisir un service';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSubmitting(false);
      return;
    }

    setFormErrors({});

    try {
      // 1. Sauvegarde dans la base de données Firebase
      await addDoc(collection(db, 'contact_requests'), {
        name,
        email,
        service,
        message,
        createdAt: serverTimestamp()
      });

      // 2. Envoi de l'email via l'API
      await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, service, message }),
      });

      setSubmitSuccess(true);
    } catch (error: any) {
      console.error('Error submitting contact request:', error);
      setSubmitError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    
    setNewsletterStatus('loading');
    try {
      await addDoc(collection(db, 'newsletter_subscribers'), {
        email: newsletterEmail,
        createdAt: serverTimestamp()
      });
      setNewsletterStatus('success');
      setNewsletterEmail('');
      showToast('Inscription à la newsletter réussie !');
    } catch (error: any) {
      console.error('Error subscribing to newsletter:', error);
      setNewsletterStatus('error');
      showToast('Erreur lors de l\'inscription.');
    }
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Nexus Digital',
          text: 'Découvrez Nexus Digital, leader en transformation numérique.',
          url: window.location.href,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Lien copié dans le presse-papier !');
    }
  };

  return (
    <>
      {/* Loading Animation */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(20px)" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-background"
          >
            <div className="relative flex flex-col items-center justify-center">
              {/* Particles */}
              {isMounted && [...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    opacity: 0,
                    scale: Math.random() * 0.5 + 0.5
                  }}
                  animate={{ 
                    x: (Math.random() - 0.5) * 400, 
                    y: (Math.random() - 0.5) * 400, 
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0]
                  }}
                  transition={{ 
                    duration: Math.random() * 2 + 2, 
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: Math.random() * 2
                  }}
                  className="absolute w-2 h-2 bg-primary/40 rounded-full blur-[2px]"
                />
              ))}
              {/* Glowing orb behind */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [0.5, 1.5, 1], opacity: [0, 0.5, 0.8] }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="absolute w-64 h-64 bg-primary/20 rounded-full blur-[60px]"
              />
              {/* Logo Text */}
              <motion.div
                initial={{ opacity: 0, letterSpacing: "0.5em", y: 20 }}
                animate={{ opacity: 1, letterSpacing: "-0.04em", y: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="text-4xl md:text-6xl font-black text-white font-headline uppercase relative z-10"
              >
                NEXUS<span className="text-primary">.</span>DIGITAL
              </motion.div>
              {/* Loading bar */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="mt-8 h-[2px] bg-white/10 w-48 rounded-full overflow-hidden relative z-10"
              >
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  className="h-full bg-gradient-to-r from-primary to-secondary"
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient Background Elements */}
      <div className="fixed inset-0 noise z-50"></div>
      <div className="orb w-[500px] h-[500px] bg-primary-container top-[-100px] left-[-100px]"></div>
      <div className="orb w-[600px] h-[600px] bg-secondary top-[40%] right-[-200px]"></div>
      <div className="orb w-[400px] h-[400px] bg-tertiary-container bottom-[-100px] left-[20%]"></div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] glass px-6 py-3 rounded-full border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
          <p className="text-white text-sm font-medium">{toastMessage}</p>
        </div>
      )}

      {/* Top Navigation Bar */}
      <nav className="fixed top-0 w-full z-40 flex justify-between items-center px-8 py-5 bg-[#131318]/40 backdrop-blur-[24px] border-b border-white/10 shadow-[0_20px_50px_rgba(108,99,255,0.08)]">
        <div 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-xl font-black tracking-tighter text-white font-headline uppercase cursor-pointer"
        >
          NEXUS.DIGITAL
        </div>
        <div className="hidden md:flex gap-10 font-headline tracking-[-0.04em] uppercase text-sm">
          <button onClick={() => scrollToSection('services')} className="text-white/60 hover:text-white transition-all duration-300">Expertise</button>
          <button onClick={() => scrollToSection('pricing')} className="text-white/60 hover:text-white transition-all duration-300">Projets</button>
          <button onClick={() => scrollToSection('vision')} className="text-white/60 hover:text-white transition-all duration-300">Vision</button>
          <button onClick={() => showToast('Le blog sera bientôt disponible !')} className="text-white/60 hover:text-white transition-all duration-300">Blog</button>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary hover:shadow-[0_0_30px_rgba(196,192,255,0.4)] transition-all duration-500 text-on-primary font-headline uppercase text-xs tracking-widest font-bold px-6 py-3 rounded-full scale-95 active:scale-100"
        >
          Devis gratuit
        </button>
      </nav>

      <main className="relative pt-32">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-8 mb-32 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-white/5 text-[10px] uppercase tracking-[0.2em] font-bold text-secondary">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              Innovation 2024
            </div>
            <h1 className="font-headline text-6xl md:text-8xl font-bold tracking-[-0.04em] leading-[0.95] text-white">
              Votre Présence Digitale, Votre Actif le Plus <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Rentable</span>
            </h1>
            <p className="text-on-surface-variant text-xl max-w-xl font-light leading-relaxed">
              Sites haute performance · Cartes NFC · QR Dynamiques. Nous architecturons les infrastructures numériques des leaders de demain en Afrique Centrale.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOpenModal()}
                className="px-8 py-5 rounded-xl bg-gradient-to-br from-primary to-inverse-primary text-on-primary-container font-bold font-headline uppercase tracking-wider text-sm shadow-[0_15px_40px_rgba(135,129,255,0.3)]"
              >
                Démarrer mon projet
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollToSection('services')}
                className="px-8 py-5 rounded-xl glass border border-outline-variant/30 text-white font-headline uppercase tracking-wider text-sm transition-colors"
              >
                Voir nos services
              </motion.button>
            </div>
          </div>
          <div className="lg:col-span-5 relative">
            <div className="relative glass rounded-3xl p-2 aspect-square overflow-hidden group">
              <Image 
                className="w-full h-full object-cover rounded-[2rem] transition-transform duration-700 group-hover:scale-110" 
                alt="Futuristic dark workspace with holographic data screens showing glowing African map and abstract digital architecture textures" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBm9HQZPSjH0QFSacrU0I1n8keb6c_x29TByHfpPDWmyGh6Z7-uySN6UQAeKlEfdEpZnBwc5lFzvCrU-G1UVf6WbVe8aSq2rdBTpHqJautb6LXsI1roMjqqNEN-BTgzbu0YrxAWD8xtXmOPGj66YXjvtVvv4Tvg_BOhAq8qFfRmBH9YyNqw4Sv2tsACooWQlGmVQASIg1AA2GANBOnOESXkzXmDu4N4YAJlYPjX0eNUe-t5SLLaHzF3Dj1Ne7IWIlF1cZ-OsPIRx5g"
                fill
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60"></div>
              {/* Hero Stats Floating */}
              <div className="absolute bottom-8 left-8 right-8 glass p-6 rounded-2xl border border-white/10">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-headline font-bold text-white">150+</div>
                    <div className="text-[10px] uppercase tracking-widest text-on-surface-variant">Projets Livrés</div>
                  </div>
                  <div>
                    <div className="text-2xl font-headline font-bold text-secondary">99.9%</div>
                    <div className="text-[10px] uppercase tracking-widest text-on-surface-variant">Performance</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="max-w-7xl mx-auto px-8 mb-40">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl">
              <h2 className="font-label text-primary tracking-[0.2em] mb-4 uppercase font-bold text-xs">Écosystème technologique</h2>
              <h3 className="text-5xl font-headline font-bold text-white tracking-tighter">Des solutions pensées pour l&apos;impact.</h3>
            </div>
            <div className="text-on-surface-variant text-sm font-light max-w-xs text-right">
              Nous fusionnons design de classe mondiale et ingénierie robuste pour transformer chaque clic en conversion.
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Card 1 */}
            <motion.div 
              whileHover={{ y: -10, backgroundColor: "rgba(255,255,255,0.08)" }}
              className="group relative p-12 glass rounded-[2.5rem] overflow-hidden transition-all duration-500 border border-white/5"
            >
              <div className="absolute top-0 right-0 p-8">
                <span className="material-symbols-outlined text-primary text-6xl opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500">monitor</span>
              </div>
              <div className="relative z-10 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-3xl">web</span>
                </div>
                <h4 className="text-3xl font-headline font-bold text-white">Web Architecture</h4>
                <p className="text-on-surface-variant leading-relaxed text-lg">
                  Écosystèmes web haute performance optimisés pour le référencement et la conversion. Du corporate au e-commerce complexe.
                </p>
                <ul className="space-y-3 pt-4">
                  <li className="flex items-center gap-3 text-sm text-white/70">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Next.js & React Core
                  </li>
                  <li className="flex items-center gap-3 text-sm text-white/70">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Architecture Headless CMS
                  </li>
                </ul>
              </div>
            </motion.div>
            {/* Card 2 */}
            <motion.div 
              whileHover={{ y: -10, backgroundColor: "rgba(255,255,255,0.08)" }}
              className="group relative p-12 glass rounded-[2.5rem] overflow-hidden transition-all duration-500 border border-white/5"
            >
              <div className="absolute top-0 right-0 p-8">
                <span className="material-symbols-outlined text-secondary text-6xl opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500">bolt</span>
              </div>
              <div className="relative z-10 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary text-3xl">nfc</span>
                </div>
                <h4 className="text-3xl font-headline font-bold text-white">Smart Gateway</h4>
                <p className="text-on-surface-variant leading-relaxed text-lg">
                  Cartes de visite NFC et QR codes dynamiques connectés à une plateforme de gestion centralisée pour votre networking.
                </p>
                <ul className="space-y-3 pt-4">
                  <li className="flex items-center gap-3 text-sm text-white/70">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Update instantané Cloud
                  </li>
                  <li className="flex items-center gap-3 text-sm text-white/70">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Analytics de scan temps réel
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="mb-40 py-24 glass">
          <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            <div className="space-y-2">
              <div className="text-5xl md:text-6xl font-headline font-black text-white tracking-tighter">98%</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">Client Retention</div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl md:text-6xl font-headline font-black text-white tracking-tighter">24h</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-secondary font-bold">Support Actif</div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl md:text-6xl font-headline font-black text-white tracking-tighter">10k+</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-tertiary-container font-bold">Scans QR/Mois</div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl md:text-6xl font-headline font-black text-white tracking-tighter">4.9/5</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">Satisfaction</div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="max-w-7xl mx-auto px-8 mb-40">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-headline font-bold text-white mb-4">Investissement & Croissance</h2>
            <p className="text-on-surface-variant max-w-xl mx-auto">Choisissez le levier adapté à votre stade de développement actuel.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {/* Tier 1 */}
            <div className="glass p-10 rounded-[2rem] border border-white/5 flex flex-col justify-between hover:translate-y-[-8px] transition-transform duration-500 group">
              <div>
                <div className="text-white font-headline text-xl mb-2">Nexus Starter</div>
                <div className="text-4xl font-headline font-bold text-white mb-2">80k <span className="text-sm font-normal text-on-surface-variant">FCFA</span></div>
                <div className="text-[10px] uppercase tracking-widest text-primary font-bold mb-8 flex items-center gap-2">
                  <span className="material-symbols-outlined text-xs">settings</span>
                  Maintenance: 20k FCFA
                </div>
                <ul className="space-y-4 text-on-surface-variant text-sm mb-12">
                  <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-lg">check_circle</span>Design Glassmorphism Premium </li>
                  <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> Profil Digital Illimité</li>
                  <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> Support Standard & Intégration WhatsApp Direct</li>
                  <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> Vitesse de chargement ultra-rapide </li>
                </ul>
              </div>
              <motion.button 
                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleOpenModal('Nexus Starter')}
                className="w-full py-4 rounded-xl glass border border-white/10 text-white font-headline uppercase tracking-widest text-xs font-bold"
              >
                Commander
              </motion.button>
            </div>
            {/* Tier 2 (Highlighted) */}
            <div className="relative glass p-10 rounded-[2rem] border-2 border-primary/30 flex flex-col justify-between scale-[1.03] shadow-[0_40px_80px_rgba(108,99,255,0.15)] z-10 bg-surface-container-high group">
              <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-on-primary font-bold text-[10px] uppercase tracking-widest rounded-full animate-pulse z-20">Recommandé</div>
              <div>
                <div className="text-white font-headline text-xl mb-2">Premium Combo</div>
                <div className="flex items-end gap-3 mb-1">
                  <div className="text-4xl font-headline font-bold text-white">110k <span className="text-sm font-normal text-on-surface-variant">FCFA</span></div>
                  <div className="text-xl font-headline text-on-surface-variant line-through decoration-secondary/50 mb-1">140k</div>
                </div>
                <div className="inline-block px-3 py-1 bg-secondary/20 text-secondary border border-secondary/30 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
                  Économisez 30k FCFA
                </div>
                <div className="text-[10px] uppercase tracking-widest text-secondary font-bold mb-8 flex items-center gap-2">
                  <span className="material-symbols-outlined text-xs">settings</span>
                  Maintenance: 30k FCFA net
                </div>
                <ul className="space-y-4 text-white text-sm mb-12">
                  <li className="flex items-center gap-3"><span className="material-symbols-outlined text-secondary text-lg">check_circle</span> Site Premium</li>
                  <li className="flex items-center gap-3"><span className="material-symbols-outlined text-secondary text-lg">check_circle</span> Menu & Tarifs illimités </li>
                  <li className="flex items-center gap-3"><span className="material-symbols-outlined text-secondary text-lg">check_circle</span> Dashboard Analytics</li>
                  <li className="flex items-center gap-3"><span className="material-symbols-outlined text-secondary text-lg">check_circle</span> Bouclier de Réputation (Collecte de données clients & Filtrage Google) </li>
                  <li className="flex items-center gap-3"><span className="material-symbols-outlined text-secondary text-lg">check_circle</span> Tableau de bord gérant temps réel </li>
                  <li className="flex items-center gap-3"><span className="material-symbols-outlined text-secondary text-lg">check_circle</span> QR Codes physiques personnalisés </li>
                </ul>
              </div>
              <motion.button 
                whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(108,99,255,0.4)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleOpenModal('Premium Combo')}
                className="w-full py-4 rounded-xl bg-primary text-on-primary font-headline uppercase tracking-widest text-xs font-bold shadow-[0_10px_30px_rgba(196,192,255,0.3)]"
              >
                Sélectionner
              </motion.button>
            </div>
            {/* Tier 3 */}
            <div className="glass p-10 rounded-[2rem] border border-white/5 flex flex-col justify-between hover:translate-y-[-8px] transition-transform duration-500 group">
              <div>
                <div className="text-white font-headline text-xl mb-2">Digital Corporate</div>
                <div className="text-4xl font-headline font-bold text-white mb-2">60k <span className="text-sm font-normal text-on-surface-variant">FCFA</span></div>
                <div className="text-[10px] uppercase tracking-widest text-tertiary-container font-bold mb-8 flex items-center gap-2">
                  <span className="material-symbols-outlined text-xs">settings</span>
                  Maintenance: 15k FCFA
                </div>
                <ul className="space-y-4 text-on-surface-variant text-sm mb-12">
                  <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> Management de Flotte NFC</li>
                  <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> SEO Avancé & Blog</li>
                  <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> Account Manager Dédié</li>
                </ul>
              </div>
              <motion.button 
                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleOpenModal('Digital Corporate')}
                className="w-full py-4 rounded-xl glass border border-white/10 text-white font-headline uppercase tracking-widest text-xs font-bold"
              >
                Contacter Sales
              </motion.button>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-4xl mx-auto px-8 mb-40">
          <h2 className="text-4xl font-headline font-bold text-white text-center mb-16">Questions Fréquentes</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="glass p-6 rounded-2xl group cursor-pointer hover:bg-white/5 transition-colors border border-white/5"
              >
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">{faq.question}</span>
                  <span className={`material-symbols-outlined text-primary transition-transform ${openFaq === index ? 'rotate-180' : ''}`}>expand_more</span>
                </div>
                {openFaq === index && (
                  <div className="mt-4 text-on-surface-variant text-sm">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section id="vision" className="max-w-7xl mx-auto px-8 mb-40">
          <div className="relative overflow-hidden rounded-[3rem] p-16 md:p-24 text-center glass border border-primary/20">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 -z-10"></div>
            <div className="relative z-10 space-y-8">
              <h2 className="text-5xl md:text-7xl font-headline font-bold text-white tracking-tighter">Prêt à Transformer<br/>Votre Business ?</h2>
              <p className="text-on-surface-variant text-lg max-w-2xl mx-auto leading-relaxed">
                Rejoignez les entreprises qui redéfinissent leur futur avec Nexus Digital. Premier rendez-vous stratégique offert.
              </p>
              <div className="flex flex-col md:flex-row justify-center gap-6 pt-4">
                <a 
                  href="https://wa.me/237686382354" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold transition-all hover:scale-105 shadow-[0_20px_40px_rgba(37,211,102,0.2)]"
                >
                  <span className="material-symbols-outlined">chat</span>
                  WhatsApp Direct
                </a>
                <button 
                  onClick={() => handleOpenModal()}
                  className="flex items-center justify-center gap-3 px-10 py-5 rounded-2xl glass border border-white/10 hover:bg-white/10 text-white font-bold transition-all"
                >
                  Réserver un appel
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#131318] border-t border-white/5 pt-20 pb-10 w-full">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="col-span-1">
            <div className="text-2xl font-black text-white mb-4 font-headline tracking-tighter">NEXUS.DIGITAL</div>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
              Leader en transformation numérique en Afrique Centrale. Nous concevons le futur, un pixel à la fois.
            </p>
            <div className="flex gap-4">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleShare}
                className="w-10 h-10 rounded-full glass border border-white/5 flex items-center justify-center hover:text-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">share</span>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => showToast('Version anglaise bientôt disponible !')}
                className="w-10 h-10 rounded-full glass border border-white/5 flex items-center justify-center hover:text-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">language</span>
              </motion.div>
            </div>
          </div>
          <div className="col-span-1 grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h5 className="text-white text-[10px] uppercase tracking-[0.2em] font-bold">Produits</h5>
              <ul className="space-y-2 font-body text-sm tracking-[0.08em] uppercase">
                <li><button onClick={() => scrollToSection('services')} className="text-white/40 hover:text-primary transition-colors">Services</button></li>
                <li><button onClick={() => showToast('Portfolio en cours de mise à jour')} className="text-white/40 hover:text-primary transition-colors">Portfolio</button></li>
                <li><button onClick={() => showToast('Le Lab sera bientôt ouvert')} className="text-white/40 hover:text-primary transition-colors">Lab</button></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h5 className="text-white text-[10px] uppercase tracking-[0.2em] font-bold">Entreprise</h5>
              <ul className="space-y-2 font-body text-sm tracking-[0.08em] uppercase">
                <li><button onClick={() => showToast('Aucune offre d\'emploi pour le moment')} className="text-white/40 hover:text-primary transition-colors">Carrières</button></li>
                <li><a href="https://wa.me/237686382354" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-primary transition-colors">WhatsApp 1</a></li>
                <li><a href="https://wa.me/237694672484" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-primary transition-colors">WhatsApp 2</a></li>
                <li><button onClick={() => showToast('Politique de confidentialité à venir')} className="text-white/40 hover:text-primary transition-colors">Confidentialité</button></li>
              </ul>
            </div>
          </div>
          <div className="col-span-1 space-y-6">
            <h5 className="text-white text-[10px] uppercase tracking-[0.2em] font-bold">Newsletter</h5>
            <form onSubmit={handleNewsletterSubmit} className="relative">
              <input 
                className="w-full bg-surface-container border-b border-outline-variant/30 text-white p-4 focus:outline-none focus:border-secondary transition-all rounded-t-lg" 
                placeholder="Email Address" 
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                disabled={newsletterStatus === 'loading' || newsletterStatus === 'success'}
              />
              <button 
                type="submit"
                disabled={newsletterStatus === 'loading' || newsletterStatus === 'success'}
                className="absolute right-4 top-4 text-secondary hover:translate-x-1 transition-transform disabled:opacity-50"
              >
                <span className="material-symbols-outlined">
                  {newsletterStatus === 'success' ? 'check' : 'send'}
                </span>
              </button>
            </form>
            <p className="text-xs text-on-surface-variant font-light">
              {newsletterStatus === 'success' 
                ? 'Merci pour votre inscription !' 
                : newsletterStatus === 'error'
                ? 'Une erreur est survenue.'
                : 'Recevez nos dernières innovations et analyses de marché mensuelles.'}
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-8 mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest text-white/40">
          <div>© 2024 Nexus Digital. L&apos;innovation au cœur de l&apos;Afrique Centrale.</div>
          <div className="flex gap-8">
            <button onClick={() => showToast('Conditions générales à venir')} className="hover:text-white transition-colors">Termes</button>
            <button onClick={() => showToast('Politique de cookies à venir')} className="hover:text-white transition-colors">Cookies</button>
          </div>
        </div>
      </footer>

      {/* Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass w-full max-w-lg rounded-3xl p-8 relative border border-white/10 shadow-2xl">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <h3 className="text-3xl font-headline font-bold text-white mb-2">Démarrer un projet</h3>
            <p className="text-on-surface-variant text-sm mb-8">Parlez-nous de vos objectifs et nous vous proposerons la meilleure solution.</p>
            
            {submitSuccess ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-secondary text-3xl">check</span>
                </div>
                <h4 className="text-xl font-bold text-white">Demande envoyée</h4>
                <p className="text-on-surface-variant text-sm">Notre équipe vous contactera dans les plus brefs délais.</p>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="mt-8 px-8 py-3 rounded-xl glass border border-white/10 text-white font-bold text-sm hover:bg-white/5 transition-colors"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/60 font-bold mb-2">Nom complet</label>
                  <input 
                    name="name"
                    className={`w-full bg-surface-container border-b ${formErrors.name ? 'border-tertiary' : 'border-outline-variant/30'} text-white p-3 focus:outline-none focus:border-secondary transition-all rounded-t-lg text-sm`}
                    placeholder="Jean Dupont"
                  />
                  {formErrors.name && <p className="text-tertiary text-[10px] mt-1 uppercase tracking-wider">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/60 font-bold mb-2">Email professionnel</label>
                  <input 
                    name="email"
                    type="email"
                    className={`w-full bg-surface-container border-b ${formErrors.email ? 'border-tertiary' : 'border-outline-variant/30'} text-white p-3 focus:outline-none focus:border-secondary transition-all rounded-t-lg text-sm`}
                    placeholder="jean@entreprise.com"
                  />
                  {formErrors.email && <p className="text-tertiary text-[10px] mt-1 uppercase tracking-wider">{formErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/60 font-bold mb-2">Service souhaité</label>
                  <select 
                    name="service"
                    defaultValue={modalService}
                    className={`w-full bg-surface-container border-b ${formErrors.service ? 'border-tertiary' : 'border-outline-variant/30'} text-white p-3 focus:outline-none focus:border-secondary transition-all rounded-t-lg text-sm appearance-none`}
                  >
                    <option value="">Sélectionnez un service</option>
                    <option value="Nexus Starter">Nexus Starter (80k FCFA)</option>
                    <option value="Premium Combo">Premium Combo (110k FCFA)</option>
                    <option value="Digital Corporate">Digital Corporate (60k FCFA)</option>
                    <option value="Autre">Autre demande</option>
                  </select>
                  {formErrors.service && <p className="text-tertiary text-[10px] mt-1 uppercase tracking-wider">{formErrors.service}</p>}
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/60 font-bold mb-2">Détails du projet</label>
                  <textarea 
                    name="message"
                    rows={4}
                    className="w-full bg-surface-container border-b border-outline-variant/30 text-white p-3 focus:outline-none focus:border-secondary transition-all rounded-t-lg text-sm resize-none"
                    placeholder="Décrivez brièvement vos besoins..."
                  ></textarea>
                </div>
                
                {submitError && <p className="text-tertiary text-sm">{submitError}</p>}
                
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl bg-gradient-to-br from-primary to-inverse-primary text-on-primary-container font-headline uppercase tracking-widest text-xs font-bold shadow-[0_10px_30px_rgba(135,129,255,0.2)] disabled:opacity-70"
                >
                  {isSubmitting ? 'Envoi en cours...' : 'Envoyer la demande'}
                </motion.button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
