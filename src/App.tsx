import type React from "react"
import { useState, useEffect } from "react"
import axios from "axios"

const API_URL = "https://api.green-api.com"

interface Message {
  type: "outgoing" | "incoming"
  text: string
  timestamp: number
}

interface Chat {
  number: string
  messages: Message[]
}

function App() {
  const [idInstance, setIdInstance] = useState("")
  const [apiTokenInstance, setApiTokenInstance] = useState("")
  const [isConfigured, setIsConfigured] = useState(false)
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [newNumber, setNewNumber] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (isConfigured) {
      const interval = setInterval(receiveNotification, 5000)
      return () => clearInterval(interval)
    }
  }, [isConfigured])

  const handleConfig = (e: React.FormEvent) => {
    e.preventDefault()
    if (idInstance && apiTokenInstance) {
      setIsConfigured(true)
    }
  }

  const createNewChat = (e: React.FormEvent) => {
    e.preventDefault()
    if (newNumber) {
      if (!chats.find((chat) => chat.number === newNumber)) {
        setChats((prev) => [...prev, { number: newNumber, messages: [] }])
      }
      setSelectedChat(newNumber)
      setNewNumber("")
    }
  }

  const deleteChat = (number: string) => {
    setChats((prev) => prev.filter((chat) => chat.number !== number))
    if (selectedChat === number) {
      setSelectedChat(null)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedChat || !message) return

    try {
      await axios.post(`${API_URL}/waInstance${idInstance}/sendMessage/${apiTokenInstance}`, {
        chatId: `${selectedChat}@c.us`,
        message: message,
      })

      const newMessage: Message = {
        type: "outgoing",
        text: message,
        timestamp: Date.now(),
      }

      setChats((prev) =>
        prev.map((chat) =>
          chat.number === selectedChat ? { ...chat, messages: [...chat.messages, newMessage] } : chat,
        ),
      )

      setMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const receiveNotification = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/waInstance${idInstance}/receiveNotification/${apiTokenInstance}?receiveTimeout=5`,
      )

      if (response.data && response.data.body && response.data.body.messageData) {
        const senderNumber = response.data.body.senderData.sender.split("@")[0]
        const newMessage: Message = {
          type: "incoming",
          text: response.data.body.messageData.textMessageData.textMessage,
          timestamp: response.data.body.timestamp * 1000,
        }

        setChats((prev) => {
          const existingChat = prev.find((chat) => chat.number === senderNumber)
          if (existingChat) {
            return prev.map((chat) =>
              chat.number === senderNumber ? { ...chat, messages: [...chat.messages, newMessage] } : chat,
            )
          } else {
            return [...prev, { number: senderNumber, messages: [newMessage] }]
          }
        })
      }
    } catch (error) {
      console.error("Error receiving notification:", error)
    }
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <form onSubmit={handleConfig} className="bg-white p-8 rounded-lg shadow-md w-96">
          <h2 className="text-2xl font-bold mb-4">Configure Green API</h2>
          <input
            type="text"
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value)}
            placeholder="idInstance"
            className="w-full p-2 mb-4 border rounded"
          />
          <input
            type="text"
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
            placeholder="apiTokenInstance"
            className="w-full p-2 mb-4 border rounded"
          />
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
            Configure
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Left sidebar - Chat list */}
      <div className="w-96 bg-white border-r">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Chats</h1>
          <form onSubmit={createNewChat} className="mb-4 space-y-2">
            <input
              type="text"
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              placeholder="Phone number"
              className="w-full p-2 border rounded"
            />
            <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
              Create New Chat
            </button>
          </form>
          <div className="space-y-2">
            {chats.map((chat) => (
              <div key={chat.number} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                <button onClick={() => setSelectedChat(chat.number)} className="flex-grow text-left">
                  {chat.number}
                </button>
                <button
                  onClick={() => deleteChat(chat.number)}
                  className="ml-2 bg-red-500 text-white px-4 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Chat messages */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <div className="bg-white p-4 border-b">
              <h2 className="text-xl font-bold">{selectedChat}</h2>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {chats
                .find((chat) => chat.number === selectedChat)
                ?.messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`max-w-[80%] mb-2 p-2 rounded ${
                      msg.type === "outgoing" ? "ml-auto bg-blue-100" : "bg-white border"
                    }`}
                  >
                    <p>{msg.text}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                  </div>
                ))}
            </div>
            <form onSubmit={sendMessage} className="bg-white p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message"
                  className="flex-1 p-2 border rounded"
                />
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <p className="text-gray-500">Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App

