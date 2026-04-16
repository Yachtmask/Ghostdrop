import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Shield, Key, Clock, AlertTriangle, Mail } from 'lucide-react';

const FAQ = () => {
  const faqs = [
    {
      icon: <Shield className="w-6 h-6 text-blue-400" />,
      question: "What is GhostDrop?",
      answer: "GhostDrop is a decentralized dead man's switch. It allows you to securely encrypt and store files on the decentralized Shelby network. You set a timer, and if you fail to 'check in' before the timer expires, the system automatically releases the decryption keys to your designated recipients via Email or Telegram."
    },
    {
      icon: <Key className="w-6 h-6 text-purple-400" />,
      question: "How does encryption and passphrase management work?",
      answer: "Your files are encrypted locally in your browser using AES-256-GCM before they are ever uploaded. The raw file never leaves your device. The passphrase you provide is sent securely to our backend watchdog, which holds it in strict confidence. The watchdog only releases this passphrase to your recipients if your timer expires."
    },
    {
      icon: <Clock className="w-6 h-6 text-green-400" />,
      question: "How do I prevent my vault from dropping?",
      answer: "Simply navigate to your Dashboard and click the 'Check In' button on your active vaults. This will reset the countdown timer back to its original duration. If you no longer need a vault, you can delete it entirely."
    },
    {
      icon: <Mail className="w-6 h-6 text-orange-400" />,
      question: "How do recipients get notified?",
      answer: "When a vault drops, our backend watchdog sends an automated message to the email addresses and Telegram handles you specified during creation. This message contains a secure download link and the decryption passphrase. Note: For Telegram, ensure you provide the recipient's exact Chat ID or handle."
    },
    {
      icon: <AlertTriangle className="w-6 h-6 text-red-400" />,
      question: "Recipient Security Tips",
      answer: "It is highly recommended to inform your recipients beforehand that they might receive an automated message from GhostDrop. This prevents the critical notification from being ignored or marked as spam. Ensure you double-check their contact information when creating the vault."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-12">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto border border-slate-800">
          <HelpCircle className="w-10 h-10 text-blue-400" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Help & FAQ</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Learn how to use GhostDrop effectively, manage your passphrases, and ensure your recipients get your data when it matters most.
        </p>
      </div>

      <div className="space-y-6">
        {faqs.map((faq, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 shrink-0">
                {faq.icon}
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-100">{faq.question}</h3>
                <p className="text-slate-400 leading-relaxed">{faq.answer}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
