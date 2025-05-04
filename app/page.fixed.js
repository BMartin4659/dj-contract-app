'use client';

import { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import emailjs from '@emailjs/browser';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import StripeCheckout from '../components/StripeCheckout';
import Header from '../components/Header';
import EnvChecker from '../components/EnvChecker';
import EnvTest from '../components/EnvTest';
import { 
  FaCheckCircle, 
  FaShieldAlt,
  FaReceipt,
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaCalendarAlt,
  FaUsers,
  FaBuilding,
  FaMapMarkerAlt,
  FaClock,
  FaLightbulb,
  FaCamera,
  FaVideo,
  FaCheck,
  FaPlus,
  FaMinus,
  FaPaypal,
  FaCreditCard,
  FaInfoCircle,
  FaMobileAlt,
  FaPhoneAlt,
  FaUserAlt,
  FaFacebookSquare,
  FaInstagram, 
  FaArrowRight,
  FaPlayCircle,
  FaMusic,
  FaTimes,
  FaList,
  FaRegClock,
  FaRegMoneyBillAlt
} from 'react-icons/fa';
import { BsStripe } from 'react-icons/bs';
import { SiVenmo, SiCashapp } from 'react-icons/si';
import { v4 as uuidv4 } from 'uuid';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import Logo from '../components/Logo';
import LoadingDots from '../components/LoadingDots';
import { handleNavigationClick } from '../lib/eventHandlers';
import { isValidEmail, isValidPhoneNumber } from '../lib/validation';
import Footer from '../components/Footer';
import { getStreamingLogo } from './components/StreamingLogos';
import CustomDatePicker from './components/CustomDatePicker';
import SignatureField from '../components/SignatureField'; 