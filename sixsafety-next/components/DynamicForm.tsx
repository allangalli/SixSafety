"use client";

import { useState, useEffect } from "react";
import type { UISchemaType, SurveyResponse } from "@/lib/schemas/ui-schema";

interface DynamicFormProps {
  schema: UISchemaType;
  onSubmit: (values: SurveyResponse) => void;
  disabled?: boolean;
}

export function DynamicForm({ schema, onSubmit, disabled = false }: DynamicFormProps) {
  const [values, setValues] = useState<SurveyResponse>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when schema changes
  useEffect(() => {
    setValues({});
    setErrors({});
  }, [schema]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const newErrors: Record<string, string> = {};

    schema.ui_elements.forEach((element) => {
      if ("required" in element && element.required && !values[element.label]) {
        newErrors[element.label] = "This field is required";
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">{schema.title}</h2>

      {schema.ui_elements.map((element, index) => {
        const key = `${element.type}-${index}`;

        switch (element.type) {
          case "select":
            return (
              <div key={key} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {element.label}
                  {element.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <select
                  value={values[element.label] || ""}
                  onChange={(e) => {
                    setValues({ ...values, [element.label]: e.target.value });
                    setErrors({ ...errors, [element.label]: "" });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={disabled}
                >
                  <option value="">Select an option...</option>
                  {element.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors[element.label] && (
                  <p className="text-sm text-red-600">{errors[element.label]}</p>
                )}
              </div>
            );

          case "checkbox-group":
            return (
              <div key={key} className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  {element.label}
                </label>
                <div className="space-y-2">
                  {element.options.map((option) => {
                    const currentValues = (values[element.label] || []) as string[];
                    const isChecked = currentValues.includes(option);

                    return (
                      <label key={option} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const newValues = e.target.checked
                              ? [...currentValues, option]
                              : currentValues.filter((v) => v !== option);
                            setValues({ ...values, [element.label]: newValues });
                          }}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          disabled={disabled}
                        />
                        <span className="text-sm text-gray-700">{option}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );

          case "radio-group":
            return (
              <div key={key} className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  {element.label}
                  {element.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <div className="space-y-2">
                  {element.options.map((option) => (
                    <label key={option} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name={element.label}
                        value={option}
                        checked={values[element.label] === option}
                        onChange={(e) => {
                          setValues({ ...values, [element.label]: e.target.value });
                          setErrors({ ...errors, [element.label]: "" });
                        }}
                        className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                        disabled={disabled}
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
                {errors[element.label] && (
                  <p className="text-sm text-red-600">{errors[element.label]}</p>
                )}
              </div>
            );

          case "text":
            return (
              <div key={key} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {element.label}
                  {element.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  value={values[element.label] || ""}
                  onChange={(e) => {
                    setValues({ ...values, [element.label]: e.target.value });
                    setErrors({ ...errors, [element.label]: "" });
                  }}
                  placeholder={element.placeholder}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={disabled}
                />
                {errors[element.label] && (
                  <p className="text-sm text-red-600">{errors[element.label]}</p>
                )}
              </div>
            );

          case "slider":
            return (
              <div key={key} className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  {element.label}
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min={element.min}
                    max={element.max}
                    step={element.step}
                    value={values[element.label] || element.min}
                    onChange={(e) => {
                      setValues({ ...values, [element.label]: Number(e.target.value) });
                    }}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    disabled={disabled}
                  />
                  <span className="text-sm font-medium text-gray-700 min-w-[60px]">
                    {values[element.label] || element.min} {element.unit || ""}
                  </span>
                </div>
              </div>
            );

          default:
            return null;
        }
      })}

      <div className="pt-4">
        <button
          type="submit"
          disabled={disabled}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-6 py-4 rounded-lg text-lg transition-colors shadow-md hover:shadow-lg"
        >
          {disabled ? "Processing..." : "Continue"}
        </button>
      </div>
    </form>
  );
}
