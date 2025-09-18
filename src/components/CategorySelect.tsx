import React from 'react';
import { ensureSubcategory, listCategories, listSubcategories } from '../data/categories';
import { CategorySelection } from '../lib/types';

interface Props {
  value: CategorySelection;
  onChange: (value: CategorySelection) => void;
}

const categories = listCategories();

const CategorySelect: React.FC<Props> = ({ value, onChange }) => {
  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCategory = event.target.value;
    const next = ensureSubcategory(nextCategory, value.subcategory);
    onChange(next);
  };

  const handleSubcategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ category: value.category, subcategory: event.target.value });
  };

  const subcategories = listSubcategories(value.category);

  return (
    <div className="category-select">
      <select value={value.category} onChange={handleCategoryChange}>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
      <select value={value.subcategory} onChange={handleSubcategoryChange}>
        {subcategories.map((subcategory) => (
          <option key={subcategory} value={subcategory}>
            {subcategory}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CategorySelect;
