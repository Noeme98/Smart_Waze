import React, { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

const Step3Evidence = ({ formData, onInputChange }) => {
  const fileInputRef = useRef(null);
  const [uploadMessage, setUploadMessage] = useState("");

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const currentImages = formData.images || [];
    const combined = [...currentImages, ...files];

    if (combined.length > 5) {
      setUploadMessage("⚠️ You can only upload up to 5 images.");
      setTimeout(() => setUploadMessage(""), 3000);
    }

    const newImages = combined.slice(0, 5);
    onInputChange("images", newImages);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const currentImages = formData.images || [];
    const combined = [...currentImages, ...files];

    if (combined.length > 5) {
      setUploadMessage("⚠️ You can only upload up to 5 images.");
      setTimeout(() => setUploadMessage(""), 3000);
    }

    const newImages = combined.slice(0, 5);
    onInputChange("images", newImages);
  };

  const handleDragOver = (e) => e.preventDefault();

  const removeImage = (index) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    onInputChange("images", newImages);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <label className="block text-xs sm:text-sm mb-1">
          Photos <span className="text-red-500">*</span> (Up to 5 photos)
        </label>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          multiple
          className="hidden"
        />

        {/* Upload Zone */}
        <div
          onClick={() => {
            if ((formData.images || []).length >= 5) {
              setUploadMessage("⚠️ You've reached the 5-photo limit.");
              setTimeout(() => setUploadMessage(""), 3000);
              return;
            }
            fileInputRef.current?.click();
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`border ${
            formData.errors?.images ? "border-red-500" : "border-gray-600"
          } border-dashed rounded-md p-3 sm:p-4 text-gray-400 hover:border-[#2f57ff] transition cursor-pointer`}
        >
          {/* Empty State */}
          {(!formData.images || formData.images.length === 0) && (
            <div className="flex flex-col items-center justify-center gap-2 py-4 sm:py-6">
              <ImagePlus size={28} className="text-gray-400 sm:w-8 sm:h-8" />
              <p className="text-xs sm:text-sm text-center">
                Click to upload photos or drag and drop <br />
                <span className="text-[10px] sm:text-xs text-gray-500">
                  (PNG, JPG, or HEIC, max 5MB each)
                </span>
              </p>
            </div>
          )}

          {/* Image Previews */}
          {formData.images?.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {formData.images.map((file, index) => (
                <div
                  key={index}
                  className="relative group rounded-md overflow-hidden"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-20 sm:h-24 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(index);
                    }}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-red-600 transition"
                  >
                    <X size={12} className="sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>
              ))}

              {/* Add More Button */}
              {formData.images.length < 5 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center border border-dashed border-gray-600 rounded-md h-20 sm:h-24 cursor-pointer hover:border-[#2f57ff] transition"
                >
                  <ImagePlus size={20} className="text-gray-400 sm:w-6 sm:h-6" />
                  <span className="text-[10px] sm:text-xs text-gray-400 mt-1">Add more</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error or Limit Message */}
        {uploadMessage && (
          <p className="mt-2 text-xs text-red-400">{uploadMessage}</p>
        )}
        {formData.errors?.images && (
          <p className="mt-1 text-xs text-red-400">{formData.errors.images}</p>
        )}
      </div>

      <div>
        <label className="block text-xs sm:text-sm mb-1">Contact Information</label>
        <input
          type="text"
          name="contactInfo"
          value={formData.contactInfo || ""}
          onChange={(e) => onInputChange("contactInfo", e.target.value)}
          placeholder="Phone number or email for follow-up"
          className="w-full bg-transparent border border-gray-600 rounded-md p-2 text-xs sm:text-sm text-gray-300 focus:outline-none focus:border-[#2f57ff]"
        />
      </div>
    </div>
  );
};

export default Step3Evidence