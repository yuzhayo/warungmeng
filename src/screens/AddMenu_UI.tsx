import React from 'react';
import { Upload, X } from 'lucide-react';

interface Category {
  id: string;
  label: string;
}

interface AddMenuUIProps {
  isVisible: boolean;
  menuName: string;
  category: string;
  price: string;
  imageUrl: string;
  categories: Category[];
  onMenuNameChange: (name: string) => void;
  onCategoryChange: (category: string) => void;
  onPriceChange: (price: string) => void;
  onImageChange: (imageUrl: string) => void;
  onSaveClick: () => void;
  onCancelClick: () => void;
}

const AddMenuUI: React.FC<AddMenuUIProps> = ({
  isVisible,
  menuName,
  category,
  price,
  imageUrl,
  categories,
  onMenuNameChange,
  onCategoryChange,
  onPriceChange,
  onImageChange,
  onSaveClick,
  onCancelClick
}) => {
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onImageChange(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    onImageChange('');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="relative"
        style={{
          borderRadius: '5px',
          background: 'linear-gradient(180deg, #ffffff 0%, #c5c4f2 59.97%)',
          border: '20px solid #36c7fc',
          boxShadow: '0px 4px 4px rgba(0,0,0,0.25)'
        }}
        className="w-11/12 max-w-4xl h-auto max-h-[90vh] p-6 flex flex-col items-center space-y-4 overflow-y-auto"
      >
        {/* Menu Name Input */}
        <div className="w-full max-w-xl h-auto min-h-[70px] flex items-center justify-center">
          <div
            className="w-full h-full rounded-lg flex items-center justify-center relative"
            style={{
              background: 'linear-gradient(180deg, #ffffff 46.37%, #e2e2e2 100%)'
            }}
          >
            <input
              type="text"
              value={menuName}
              onChange={(e) => onMenuNameChange(e.target.value)}
              placeholder="Menu Name"
              className="w-4/5 h-3/5 text-center bg-transparent border-none outline-none text-4xl font-normal text-gray-500 placeholder-gray-500"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
          </div>
        </div>

        {/* Image Upload Section */}
        <div className="w-full max-w-xl h-auto min-h-[120px] flex items-center justify-center">
          <div
            className="w-full h-full rounded-lg flex items-center justify-center relative"
            style={{
              background: 'linear-gradient(180deg, #ffffff 46.37%, #e2e2e2 100%)'
            }}
          >
            {imageUrl ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt="Menu item preview"
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-gray-500 text-lg">Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Category Input */}
        <div className="w-full max-w-xl h-auto min-h-[70px] flex items-center justify-center">
          <div
            className="w-full h-full rounded-lg flex items-center justify-center relative"
            style={{
              background: 'linear-gradient(180deg, #ffffff 46.37%, #e2e2e2 100%)'
            }}
          >
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className={`w-4/5 h-3/5 text-center bg-transparent border-none outline-none appearance-none cursor-pointer ${
                category ? 'text-black' : 'text-gray-500'
              }`}
              className={`w-4/5 h-3/5 text-center bg-transparent border-none outline-none appearance-none cursor-pointer text-4xl font-normal ${
                category ? 'text-black' : 'text-gray-500'
              }`}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <option value="" disabled className="text-gray-500">
                Select Category
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.label} className="text-black">
                  {cat.label}
                </option>
              ))}
            </select>
            {/* Custom dropdown arrow */}
            <div className="absolute right-8 pointer-events-none">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Price Input */}
        <div className="w-full max-w-xl h-auto min-h-[70px] flex items-center justify-center">
          <div
            className="w-full h-full rounded-lg flex items-center justify-center relative"
            style={{
              background: 'linear-gradient(180deg, #ffffff 46.37%, #e2e2e2 100%)'
            }}
          >
            <input
              type="number"
              value={price}
              onChange={(e) => onPriceChange(e.target.value)}
              placeholder="Price"
              step="0.01"
              min="0"
              className="w-4/5 h-3/5 text-center bg-transparent border-none outline-none text-4xl font-normal text-gray-500 placeholder-gray-500"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-xl flex justify-between space-x-4 mt-auto p-4">
          {/* Cancel Button */}
          <div 
            className="flex-1 py-4 cursor-pointer flex items-center justify-center"
            style={{
              borderRadius: '10px',
              background: 'linear-gradient(180deg, #ffffff 0%, #f6556d 100%)',
              boxShadow: '0px 4px 4px rgba(0,0,0,0.25)'
            }}
            onClick={onCancelClick}
          >
            <span
              className="text-5xl font-normal text-black"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              CANCEL
            </span>
          </div>

          {/* Save Button */}
          <div 
            className={`flex-1 py-4 flex items-center justify-center ${
              menuName.trim() && category.trim() && price.trim() && parseFloat(price) > 0
                ? 'cursor-pointer' 
                : 'cursor-not-allowed opacity-50'
            }`}
            style={{
              borderRadius: '10px',
              background: 'linear-gradient(180deg, #ffffff 0%, #55f678 100%)',
              boxShadow: '0px 4px 4px rgba(0,0,0,0.25)'
            }}
            onClick={
              menuName.trim() && category.trim() && price.trim() && parseFloat(price) > 0
                ? onSaveClick 
                : undefined
            }
          >
            <span
              className="text-5xl font-normal text-black"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              SAVE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMenuUI;