import React from 'react';
import { Tag, Calendar, Hash, Trash2, AlertCircle } from 'lucide-react';

interface Category {
  id: string;
  label: string;
  createdAt?: string;
  itemCount?: number;
}

interface CategoryScreenUIProps {
  categories: Category[];
  selectedCategory: Category | null;
  onCategoryClick: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
}

const CategoryScreenUI: React.FC<CategoryScreenUIProps> = ({
  categories,
  selectedCategory,
  onCategoryClick,
  onDeleteCategory
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Unknown';
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, categoryId: string) => {
    e.stopPropagation(); // Prevent category selection when clicking delete
    onDeleteCategory(categoryId);
  };

  return (
    <div className="w-full h-full bg-main-gray rounded-lg shadow-custom overflow-hidden">

      {/* Content */}
      <div className="p-6 h-full overflow-y-auto">
        <div className="grid gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              onClick={() => onCategoryClick(category)}
              className={`bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:scale-102 ${
                selectedCategory?.id === category.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
            >
              {/* Category Header */}
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-3">
                  <Tag className="w-6 h-6 text-blue-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{category.label}</h3>
                    <span className="text-sm font-mono text-gray-500">#{category.id}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="text-right text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(category.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-1 mt-1">
                      <Hash className="w-4 h-4" />
                      <span>{category.itemCount || 0} items</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteClick(e, category.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-200"
                    title="Delete category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedCategory?.id === category.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Details:</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">ID:</span>
                          <span className="text-gray-800 font-mono">{category.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Label:</span>
                          <span className="text-gray-800">{category.label}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Created:</span>
                          <span className="text-gray-800">{formatDate(category.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Statistics:</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Menu Items:</span>
                          <span className="text-gray-800">{category.itemCount || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className="text-green-600 font-medium">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {categories.length === 0 && (
          <div className="text-center text-white text-lg opacity-80 mt-20">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No categories found</p>
            <p className="text-sm mt-2">Categories will appear here once they are created in the Home tab</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryScreenUI;