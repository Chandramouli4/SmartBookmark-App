"use client";
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, ArrowRight, Zap, Globe, Layers } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  // Check Supabase session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/dashboard");
      }
      setLoading(false);
    });
  }, [router]);

  // Google login handler
  const handleGoogleLogin = async () => {
    if (authLoading) return;
    setAuthLoading(true);
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
        window.location.origin;
      const redirectTo = new URL("/auth/callback", baseUrl).toString();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) {
        console.error("Error logging in:", error.message);
        alert(`Google sign-in failed: ${error.message}`);
      }
    } catch (error) {
      console.error("Google sign-in failed:", error);
      alert(`Google sign-in failed: ${error?.message || "Unknown error"}`);
    } finally {
      setAuthLoading(false);
    }
  };

  // Loading spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="w-6 h-6 text-purple-400 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Main hero section
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-white/5 px-4 py-1.5 text-sm text-blue-400 shadow-[0_0_15px_rgba(0,243,255,0.2)] backdrop-blur mb-6"
            >
              <Zap size={16} className="text-pink-400" />
              <span className="font-mono tracking-wide">NEXT-GEN BOOKMARKING</span>
            </motion.div>

            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              Smart bookmarking, simplified.
            </h1>

            <p className="mt-6 text-base sm:text-lg text-gray-300 max-w-lg leading-relaxed">
              Save, search, and sync your links with secure Google sign-in.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGoogleLogin}
                disabled={authLoading}
                className="group relative inline-flex items-center justify-center gap-3 rounded-xl bg-white/10 px-8 py-4 font-bold text-white transition-all duration-300 border border-white/20 hover:bg-white/20 hover:border-blue-400 overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10">Continue with Google</span>
                {authLoading ? (
                  <div className="relative z-10 w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                )}
              </motion.button>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
              {[
                { label: "Synced", icon: Globe, value: "Real-time" },
                { label: "Speed", icon: Zap, value: "Instant" },
                { label: "Secure", icon: Shield, value: "Enterprise-grade" },
              ].map((stat, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2 text-blue-400 mb-1">
                    <stat.icon size={14} />
                    <span className="text-xs font-mono uppercase tracking-wider">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Column: Visuals */}
          <div className="relative h-[500px] hidden lg:block perspective-1000">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="relative w-full max-w-md aspect-[3/4]">
                {/* Decorative Orbs */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

                {/* Glass Cards Stack */}
                <div className="relative w-full h-full">
                  {[
                    { title: "Design Resources", count: "12 links", color: "from-pink-500/20 to-purple-600/20" },
                    { title: "Dev Tools", count: "8 links", color: "from-blue-500/20 to-cyan-400/20" },
                    { title: "Inspiration", count: "24 links", color: "from-amber-400/20 to-orange-500/20" }
                  ].map((card, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 50, scale: 0.9 }}
                      animate={{ opacity: 1, y: index * 60, scale: 1 - index * 0.05 }}
                      transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                      className={`absolute top-0 left-0 right-0 h-48 rounded-2xl border border-white/10 bg-gradient-to-br ${card.color} backdrop-blur-md p-6 shadow-xl`}
                      style={{ top: index * 80, zIndex: 30 - index * 10, willChange: "transform" }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-lg bg-white/10">
                          <Layers className="text-white" size={24} />
                        </div>
                        <span className="text-xs font-mono text-white/50">{card.count}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
                      <div className="flex gap-2">
                        <div className="h-2 w-12 rounded-full bg-white/20" />
                        <div className="h-2 w-8 rounded-full bg-white/10" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

            </div>
      </div>
    </div>
  );
}

