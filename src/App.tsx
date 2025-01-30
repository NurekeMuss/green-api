import { useState, useEffect } from "react"
import axios from "axios"
import ContactList from "./components/ContactList"
import ChatWindow from "./components/ChatWindow"

const API_URL = "https://7103.api.greenapi.com"
const ID_INSTANCE = "7103183439"
const API_TOKEN = "ee4ac9d5378c4817bb06f3d21a0cbd77ac6af1b98a7145b79f"

interface Contact {
  id: string
  name: string
  contactName: string
  type: "user" | "group"
  lastMessage?: string
  unreadCount?: number
  hasNewMessage?: boolean // Added hasNewMessage property
}

interface Message {
  type: "incoming" | "outgoing"
  text: string
  chatId?: string
  timestamp: number
  idMessage: string
}

function App() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    fetchContacts()
    const interval = setInterval(receiveNotification, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedContact) {
      fetchChatHistory(selectedContact.id)
    }
  }, [selectedContact])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedContact(null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  const fetchContacts = async () => {
    try {
      const response = await axios.get<Contact[]>(`${API_URL}/waInstance${ID_INSTANCE}/getContacts/${API_TOKEN}`)
      const filteredContacts = response.data
        .filter((contact) => contact.type === "user" && contact.id.includes("@c.us"))
        .sort((a, b) => a.name.localeCompare(b.name))
      setContacts(filteredContacts)
    } catch (error) {
      console.error("Error fetching contacts:", error)
    }
  }

  const fetchChatHistory = async (chatId: string) => {
    try {
      const response = await axios.post(`${API_URL}/waInstance${ID_INSTANCE}/getChatHistory/${API_TOKEN}`, {
        chatId: chatId,
        count: 100,
      })
      const chatHistory: Message[] = response.data.map((msg: any) => ({
        type: msg.type === "outgoing" ? "outgoing" : "incoming",
        text: msg.textMessage,
        chatId: chatId,
        timestamp: msg.timestamp,
        idMessage: msg.idMessage,
      }))
      setMessages(chatHistory)
    } catch (error) {
      console.error("Error fetching chat history:", error)
    }
  }

  const sendMessage = async (chatId: string, message: string) => {
    try {
      const response = await axios.post(`${API_URL}/waInstance${ID_INSTANCE}/sendMessage/${API_TOKEN}`, {
        chatId: chatId,
        message: message,
      })
      const newMessage: Message = {
        type: "outgoing",
        text: message,
        chatId: chatId,
        timestamp: Date.now() / 1000,
        idMessage: response.data.idMessage,
      }
      setMessages((prevMessages) => [...prevMessages, newMessage])
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const receiveNotification = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/waInstance${ID_INSTANCE}/receiveNotification/${API_TOKEN}?receiveTimeout=5`,
      )
      if (response.data && response.data.body && response.data.body.messageData) {
        const newMessage: Message = {
          type: "incoming",
          text: response.data.body.messageData.textMessageData.textMessage,
          chatId: response.data.body.senderData.chatId,
          timestamp: response.data.body.timestamp,
          idMessage: response.data.body.idMessage,
        }
        setMessages((prevMessages) => [...prevMessages, newMessage])

        // Update contact's last message, unread count, and move to top
        setContacts((prevContacts) => {
          const updatedContacts = prevContacts.map((contact) => {
            if (contact.id === newMessage.chatId) {
              return {
                ...contact,
                lastMessage: newMessage.text,
                unreadCount: (contact.unreadCount || 0) + 1,
                hasNewMessage: true, // Add this flag
              }
            }
            return contact
          })

          // Move the updated contact to the top
          const contactIndex = updatedContacts.findIndex((contact) => contact.id === newMessage.chatId)
          if (contactIndex !== -1) {
            const [movedContact] = updatedContacts.splice(contactIndex, 1)
            return [movedContact, ...updatedContacts]
          }

          return updatedContacts
        })
      }
    } catch (error) {
      console.error("Error receiving notification:", error)
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <ContactList contacts={contacts} onSelectContact={setSelectedContact} selectedContact={selectedContact} />
      <ChatWindow selectedContact={selectedContact} messages={messages} onSendMessage={sendMessage} />
    </div>
  )
}

export default App

