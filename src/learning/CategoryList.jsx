import React from 'react';
import CategoryCard from '../components/CategoryCard';

const CategoryList = ({ categories, onSelect }) => {
  return (
    <>
      {categories.map((cat) => {
        return (
          <CategoryCard
            key={cat._id}
            category={{ ...cat, isUnlocked: true }}
            onClick={() => onSelect(cat._id)}
          />
        );
      })}
    </>
  );
};

export default CategoryList;