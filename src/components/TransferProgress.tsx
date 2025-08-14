'use client'

import { CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface TransferProgressProps {
  currentStep: number
  totalSteps: number
  steps: Array<{
    id: number
    title: string
    description: string
    status: 'completed' | 'current' | 'pending' | 'error'
  }>
}

export default function TransferProgress({ currentStep, totalSteps, steps }: TransferProgressProps) {
  const getStepIcon = (step: typeof steps[0]) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-white" />
      case 'current':
        return <Clock className="h-5 w-5 text-white animate-pulse" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-white" />
      default:
        return <span className="text-white font-semibold">{step.id}</span>
    }
  }

  const getStepColor = (step: typeof steps[0]) => {
    switch (step.status) {
      case 'completed':
        return 'bg-green-500 border-green-500'
      case 'current':
        return 'bg-blue-500 border-blue-500 shadow-lg scale-110'
      case 'error':
        return 'bg-red-500 border-red-500'
      default:
        return 'bg-gray-300 border-gray-300'
    }
  }

  const getConnectorColor = (index: number) => {
    const nextStep = steps[index + 1]
    if (!nextStep) return ''
    
    return steps[index].status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`relative w-10 h-10 rounded-full border-2 flex items-center justify-center font-semibold transition-all duration-300 ${getStepColor(step)}`}>
                {getStepIcon(step)}
              </div>
              <div className="mt-3 text-center">
                <p className={`text-sm font-medium ${step.status === 'current' ? 'text-blue-600' : step.status === 'completed' ? 'text-green-600' : 'text-gray-500'}`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-400 mt-1 max-w-24">
                  {step.description}
                </p>
              </div>
            </div>
            
            {index < steps.length - 1 && (
              <div className="flex-1 mx-4">
                <div className={`h-1 rounded-full transition-all duration-500 ${getConnectorColor(index)}`}></div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="bg-gray-100 rounded-full h-2 mb-4">
        <div 
          className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        ></div>
      </div>
      
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Étape {currentStep} sur {totalSteps}
        </p>
      </div>
    </div>
  )
}