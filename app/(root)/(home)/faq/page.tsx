"use client"
import { Loader2 } from "lucide-react"
import type React from "react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export interface FAQ {
  _id: string
  question: string,
  answer: string
}

const FAQs = () => {
  const [data, setData] = useState<FAQ[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true) // Start with loading true
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null)
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
  })
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/faq")
        const result = await response.json()
        setData(result)
        // Removed the toast notification here
      } catch (error) {
        console.error("Error fetching FAQs:", error)
        toast.error("Failed to load FAQs")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])

  const handleEdit = (faq: FAQ) => {
    setSelectedFaq(faq)
    setFormData({
      question: faq.question,
      answer: faq.answer,
    })
    setIsEditing(true)
    // No need to scroll since we have a side-by-side layout now
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setSelectedFaq(null)
    setFormData({
      question: "",
      answer: "",
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Determine method and data based on whether we're editing or creating
    const method = isEditing && selectedFaq ? "PUT" : "POST"
    const payload = isEditing && selectedFaq 
      ? { _id: selectedFaq._id, ...formData } 
      : formData
    
    try {
      const response = await fetch("/api/faq", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        if (method === "PUT") {
          setData((prev) =>
            prev.map((faq) =>
              faq._id === selectedFaq?._id ? { ...faq, ...formData } : faq
            )
          )
          toast.success("FAQ updated successfully")
          cancelEdit()
        } else {
          const newFaq = await response.json()
          setData((prev) => [...prev, newFaq])
          setFormData({ question: "", answer: "" })
          toast.success("FAQ created successfully")
        }
      } else {
        toast.error("Operation failed. Please try again.")
      }
    } catch (error) {
      console.error(`Error ${method === "PUT" ? "updating" : "adding"} FAQ:`, error)
      toast.error("Something went wrong. Please try again.")
    }
  }

  const handleDelete = async (faqId: string) => {
    try {
      const response = await fetch("/api/faq", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ _id: faqId }),
      })

      if (response.ok) {
        setData((prev) => prev.filter((faq) => faq._id !== faqId))
        if (selectedFaq && selectedFaq._id === faqId) {
          cancelEdit()
        }
        toast.success("FAQ deleted successfully")
      } else {
        toast.error("Failed to delete FAQ")
      }
    } catch (error) {
      console.error("Error deleting FAQ:", error)
      toast.error("Something went wrong. Please try again.")
    }
  }

  return (
    <section className="flex size-full flex-col text-white">
      <h1 className="text-3xl font-bold mb-6">FAQs</h1>

      {isLoading ? (
        <div className="flex justify-center items-center my-12">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* FAQ List with scrollbar */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h2 className="text-xl font-bold mb-4">FAQ List</h2>
            <div className="max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
              {data.length === 0 ? (
                <p className="text-gray-400 italic">No FAQs available</p>
              ) : (
                data.map((q) => (
                  <div
                    className={`mb-4 p-4 rounded-lg transition-colors bg-gray-900 border ${
                      isEditing && selectedFaq?._id === q._id ? "border-blue-500 bg-blue-900/20" : "border-gray-700"
                    }`}
                    key={q._id}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 p-2 rounded transition-colors">
                        <h3 className="flex items-center mb-3 text-lg font-medium text-white">
                          <svg
                            className="flex-shrink-0 mr-2 w-5 h-5 text-gray-500 dark:text-gray-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                              clipRule="evenodd"
                            ></path>
                          </svg>
                          {q.question}
                          {isEditing && selectedFaq?._id === q._id && (
                            <span className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded">Editing</span>
                          )}
                        </h3>
                        <p className="text-gray-400">{q.answer}</p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(q)}
                          className="text-blue-500 hover:text-blue-400 p-1"
                          aria-label="Edit FAQ"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(q._id)}
                          className="text-red-500 hover:text-red-400 p-1"
                          aria-label="Delete FAQ"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add/Edit FAQ Form */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit FAQ' : 'Add New FAQ'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="question" className="block mb-2 text-sm font-medium">Question</label>
                <input
                  type="text"
                  id="question"
                  name="question"
                  value={formData.question}
                  onChange={handleInputChange}
                  className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  placeholder="Enter question"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="answer" className="block mb-2 text-sm font-medium">Answer</label>
                <textarea
                  id="answer"
                  name="answer"
                  value={formData.answer}
                  onChange={handleInputChange}
                  rows={6}
                  className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  placeholder="Enter answer"
                  required
                ></textarea>
              </div>
              
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                >
                  {isEditing ? 'Update FAQ' : 'Add FAQ'}
                </button>
                
                {isEditing && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default FAQs