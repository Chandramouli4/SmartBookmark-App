"use client";

import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Trash2, ExternalLink, LogOut } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();

  // ================= STATE =================
  const [user, setUser] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const tabIdRef = useRef(null);
  const broadcastRef = useRef(null);

  // ================= AUTH CHECK =================
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/");
        return;
      }

      setUser(session.user);
      fetchBookmarks(session.user.id);
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push("/");
      else setUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // ================= FETCH =================
  const fetchBookmarks = async (userId) => {
    setLoading(true);

    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error) setBookmarks(data || []);

    setLoading(false);
  };

  // ================= REALTIME =================
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("bookmarks-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setBookmarks((prev) => {
              if (prev.some((b) => b.id === payload.new.id)) return prev;
              return [payload.new, ...prev];
            });
          }

          if (payload.eventType === "DELETE") {
            setBookmarks((prev) =>
              prev.filter((b) => b.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // ================= MULTI TAB SYNC =================
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("BroadcastChannel" in window)) return;

    tabIdRef.current =
      crypto.randomUUID?.() || `tab-${Date.now()}`;

    const channel = new BroadcastChannel("smart-bookmarks");
    broadcastRef.current = channel;

    channel.onmessage = (event) => {
      const msg = event.data;
      if (!msg || msg.tabId === tabIdRef.current) return;
      if (msg.type === "refresh" && user) {
        fetchBookmarks(user.id);
      }
    };

    return () => channel.close();
  }, [user]);

  const broadcastRefresh = () => {
    if (!broadcastRef.current) return;
    broadcastRef.current.postMessage({
      type: "refresh",
      tabId: tabIdRef.current,
    });
  };

  // ================= ADD =================
  const handleAddBookmark = async (e) => {
    e.preventDefault();
    if (!title.trim() || !url.trim() || !user) return;

    setAdding(true);

    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = "https://" + finalUrl;
    }

    const optimisticBookmark = {
      id: "temp-" + Date.now(),
      title: title.trim(),
      url: finalUrl,
      created_at: new Date().toISOString(),
    };

    setBookmarks((prev) => [optimisticBookmark, ...prev]);

    const { data, error } = await supabase
      .from("bookmarks")
      .insert([
        { user_id: user.id, title: title.trim(), url: finalUrl },
      ])
      .select()
      .single();

    if (!error) {
      setBookmarks((prev) =>
        prev.map((b) =>
          b.id === optimisticBookmark.id ? data : b
        )
      );
      broadcastRefresh();
    } else {
      setBookmarks((prev) =>
        prev.filter((b) => b.id !== optimisticBookmark.id)
      );
      alert(error.message);
    }

    setTitle("");
    setUrl("");
    setAdding(false);
  };

  // ================= DELETE =================
  const handleDeleteBookmark = async (id) => {
    const prev = bookmarks;
    setBookmarks((current) =>
      current.filter((b) => b.id !== id)
    );

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id);

    if (error) {
      setBookmarks(prev);
      alert(error.message);
    } else {
      broadcastRefresh();
    }
  };

  // ================= LOGOUT =================
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // ================= FILTER =================
  const filteredBookmarks = bookmarks.filter(
    (b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ================= UI =================
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            My Bookmarks ({bookmarks.length})
          </h1>

          <button
            onClick={handleLogout}
            className="bg-red-500 px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>

        {/* Add Form */}
        <form
          onSubmit={handleAddBookmark}
          className="space-y-4 mb-10"
        >
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 rounded bg-gray-800"
            required
          />
          <input
            type="url"
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full p-3 rounded bg-gray-800"
            required
          />
          <button
            type="submit"
            disabled={adding}
            className="bg-purple-600 px-6 py-3 rounded-lg"
          >
            {adding ? "Saving..." : "Add Bookmark"}
          </button>
        </form>

        {/* Search */}
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full mb-6 p-3 rounded bg-gray-800"
        />

        {/* List */}
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : (
          <AnimatePresence>
            {filteredBookmarks.map((bookmark) => (
              <motion.div
                key={bookmark.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-gray-900 p-4 rounded-lg mb-3 flex justify-between items-center"
              >
                <div>
                  <a
                    href={bookmark.url}
                    target="_blank"
                    className="text-blue-400 font-medium"
                  >
                    {bookmark.title}
                  </a>
                  <p className="text-sm text-gray-500">
                    {bookmark.url}
                  </p>
                </div>

                <button
                  onClick={() =>
                    handleDeleteBookmark(bookmark.id)
                  }
                  className="text-red-400"
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
