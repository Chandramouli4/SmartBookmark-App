"use client";

import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Trash2,
  ExternalLink,
  LogOut,
} from "lucide-react";

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

  // ================= AUTH =================
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } =
        await supabase.auth.getSession();

      if (!session) {
        router.replace("/");
        return;
      }

      setUser(session.user);
      fetchBookmarks(session.user.id);
    };

    checkUser();

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        if (!session) router.replace("/");
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
    else console.error(error);

    setLoading(false);
  };

  // ================= BROADCAST =================
  const postBroadcast = (message) => {
    if (!broadcastRef.current) return;
    broadcastRef.current.postMessage(message);
  };

  useEffect(() => {
    if (!user) return;

    tabIdRef.current =
      globalThis.crypto?.randomUUID?.() ??
      `tab-${Date.now()}-${Math.random()}`;

    if (typeof window === "undefined") return;
    if (!window.BroadcastChannel) return;

    const channel = new BroadcastChannel("smart-bookmarks");
    broadcastRef.current = channel;

    channel.onmessage = (event) => {
      const message = event?.data;
      if (!message) return;
      if (message.tabId === tabIdRef.current) return;
      if (message.userId !== user.id) return;

      if (message.type === "bookmark_delete") {
        setBookmarks((current) =>
          current.filter((b) => b.id !== message.id)
        );
      }
    };

    return () => channel.close();
  }, [user]);

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
              if (prev.some((b) => b.id === payload.new.id))
                return prev;
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

    return () => supabase.removeChannel(channel);
  }, [user]);

  // ================= ADD =================
  const handleAddBookmark = async (e) => {
    e.preventDefault();
    if (!title.trim() || !url.trim() || !user) return;

    setAdding(true);

    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = "https://" + finalUrl;
    }

    const { data, error } = await supabase
      .from("bookmarks")
      .insert([
        { user_id: user.id, title: title.trim(), url: finalUrl },
      ])
      .select()
      .single();

    if (!error) {
      setBookmarks((prev) => [data, ...prev]);
    } else {
      alert(error.message);
    }

    setTitle("");
    setUrl("");
    setAdding(false);
  };

  // ================= DELETE =================
  const handleDeleteBookmark = async (id) => {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id);

    if (!error) {
      setBookmarks((prev) =>
        prev.filter((b) => b.id !== id)
      );

      postBroadcast({
        type: "bookmark_delete",
        tabId: tabIdRef.current,
        userId: user?.id,
        id,
      });
    }
  };

  // ================= LOGOUT =================
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  const filteredBookmarks = bookmarks.filter(
    (b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ================= UI =================
  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            My Bookmarks ({bookmarks.length})
          </h1>

          <button
            onClick={handleLogout}
            className="bg-red-500 px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        {/* Add */}
        <form onSubmit={handleAddBookmark} className="space-y-4 mb-8">
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
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 p-3 rounded bg-gray-800"
          />
        </div>

        {/* List */}
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
                  rel="noopener noreferrer"
                  className="text-blue-400"
                >
                  {bookmark.title}
                </a>
                <p className="text-sm text-gray-500">
                  {bookmark.url}
                </p>
              </div>

              <div className="flex gap-3">
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink size={18} />
                </a>

                <button
                  onClick={() =>
                    handleDeleteBookmark(bookmark.id)
                  }
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
