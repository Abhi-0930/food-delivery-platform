import React, { useContext } from 'react'
import './FoodDisplay.css'
import FoodItem from '../FoodItem/FoodItem'
import { StoreContext } from '../../Context/StoreContext'

const FoodDisplay = ({category}) => {

  const { food_list, searchQuery } = useContext(StoreContext);
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredFoodList = food_list.filter((item) => {
    const matchesCategory = category === "All" || category === item.category;
    const matchesSearch = !normalizedQuery
      || item.name?.toLowerCase().includes(normalizedQuery)
      || item.description?.toLowerCase().includes(normalizedQuery)
      || item.category?.toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className='food-display' id='food-display'>
      <h2>Top dishes near you</h2>
      <div className='food-display-list'>
        {filteredFoodList.length === 0 ? (
          <div className="food-display-empty">
            <h3>No items found</h3>
            <p>Try a different keyword or category.</p>
          </div>
        ) : filteredFoodList.map((item) => (
          <FoodItem
            key={item._id}
            image={item.image}
            name={item.name}
            desc={item.description}
            price={item.price}
            id={item._id}
          />
        ))}
      </div>
    </div>
  )
}

export default FoodDisplay
