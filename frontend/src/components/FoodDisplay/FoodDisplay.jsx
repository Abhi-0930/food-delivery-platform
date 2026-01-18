import React, { useContext } from 'react'
import './FoodDisplay.css'
import FoodItem from '../FoodItem/FoodItem'
import { StoreContext } from '../../Context/StoreContext'

const FoodDisplay = ({category}) => {

  const { food_list, searchQuery } = useContext(StoreContext);
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return (
    <div className='food-display' id='food-display'>
      <h2>Top dishes near you</h2>
      <div className='food-display-list'>
        {food_list.map((item)=>{
          const matchesCategory = category === "All" || category === item.category;
          const matchesSearch = !normalizedQuery
            || item.name?.toLowerCase().includes(normalizedQuery)
            || item.description?.toLowerCase().includes(normalizedQuery)
            || item.category?.toLowerCase().includes(normalizedQuery);
          if (matchesCategory && matchesSearch) {
            return <FoodItem key={item._id} image={item.image} name={item.name} desc={item.description} price={item.price} id={item._id}/>
          }
        })}
      </div>
    </div>
  )
}

export default FoodDisplay
