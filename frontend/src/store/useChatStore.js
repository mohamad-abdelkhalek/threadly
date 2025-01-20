import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  subscribeToMessages: () => {
    try {
      const { selectedUser } = get();
      if (!selectedUser) return;
      const socket = useAuthStore.getState().socket;
      if (!socket) {
        console.warn("Socket not initialized");
        return;
      }

      const handleNewMessage = (newMessage) => {
        const isMessageSentFromSelectedUser =
          newMessage.senderId === selectedUser._id;

        if (!isMessageSentFromSelectedUser) return;

        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
      };

      socket.on("newMessage", handleNewMessage);

      // Store handler for precise unsubscription
      set({ messageHandler: handleNewMessage });
    } catch (error) {
      console.error("Error in message subscription:", error);
    }
  },

  unsubscribeFromMessages: () => {
    try {
      const socket = useAuthStore.getState().socket;
      const { messageHandler } = get();

      if (socket && messageHandler) {
        socket.off("newMessage", messageHandler);
        set({ messageHandler: null });
      }
    } catch (error) {
      console.error("Error in message unsubscription:", error);
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
