"use client"
import type React from "react"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

export interface FAQ{
    _id: string
    question: string,
    answer: string
}

const FAQs = () => {
  const [data, setData] = useState<FAQ[]>([])
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
  })
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch("/api/faq")
        
        if (!response.ok) {
          throw new Error(`Failed to fetch FAQs: ${response.status} ${response.statusText}`)
        }
        
        const result = await response.json()
        setData(result)
      } catch (err) {
        console.error("Error fetching FAQs:", err)
        setError(err instanceof Error ? err.message : "Failed to load FAQs")
      } finally {
        setLoading(false)
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
    window.scrollTo({ top: 0, behavior: "smooth" })
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
    setSubmitting(true)
    setError(null)

    try {
      if (isEditing && selectedFaq) {
        const response = await fetch(`/api/faq`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            _id: selectedFaq._id,
            question: formData.question,
            answer: formData.answer,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to update FAQ: ${response.status} ${response.statusText}`)
        }

        setData((prev) =>
          prev.map((faq) =>
            faq._id === selectedFaq._id ? { ...faq, question: formData.question, answer: formData.answer } : faq,
          ),
        )
        cancelEdit()
      } else {
        const response = await fetch("/api/faq", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          throw new Error(`Failed to add FAQ: ${response.status} ${response.statusText}`)
        }

        const newFaq = await response.json()
        setData((prev) => [...prev, newFaq])
        setFormData({
          question: "",
          answer: "",
        })
      }
    } catch (err) {
      console.error("Error submitting FAQ:", err)
      setError(err instanceof Error ? err.message : "Failed to submit FAQ")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (faqId: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) {
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/faq", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ _id: faqId }),
      })

      if (!response.ok) {
        throw new Error(`Failed to delete FAQ: ${response.status} ${response.statusText}`)
      }

      setData((prev) => prev.filter((faq) => faq._id !== faqId))
      if (selectedFaq && selectedFaq._id === faqId) {
        cancelEdit()
      }
    } catch (err) {
      console.error("Error deleting FAQ:", err)
      setError(err instanceof Error ? err.message : "Failed to delete FAQ")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="flex size-full flex-col gap-5 text-white">
      <h1 className="text-3xl font-bold">FAQs</h1>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-white p-4 rounded-lg mb-4">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
        </div>
      ) : data.length === 0 ? (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 text-center">
          <p className="text-gray-400">No FAQs found</p>
        </div>
      ) : (
        data.map((q) => (
          <div
            className={`mb-10 p-4 rounded-lg transition-colors bg-gray-900 border ${
              isEditing && selectedFaq?._id === q._id ? "border-blue-500 bg-blue-900/20" : "border-gray-700"
            }`}
            key={q._id}
          >
            <div className="flex justify-between items-start">
              <div
                className="flex-1 cursor-pointer hover:bg-gray-800 p-2 rounded transition-colors"
              >
                <h3 className="flex items-center mb-4 text-lg font-medium text-white">
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
                <p className="text-gray-500 dark:text-gray-400">{q.answer}</p>
              </div>
            </div>
          </div>
        ))
      )}

      {submitting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 p-6 rounded-lg shadow-xl flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
            <p className="text-white">Processing...</p>
          </div>
        </div>
      )}
    </section>
  )
}

export default FAQs