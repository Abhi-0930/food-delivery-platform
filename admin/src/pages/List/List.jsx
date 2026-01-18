import React, { useEffect, useState } from 'react'
import './List.css'
import { url, currency } from '../../assets/assets'
import axios from 'axios';
import { toast } from 'react-toastify';
import menuData from '../../data/menuData.json';

const List = () => {

  const [list, setList] = useState([]);
  const [isLocalData, setIsLocalData] = useState(false);

  const fetchList = async () => {
    try {
      const response = await axios.get(`${url}/api/food/list`)
      if (response.data.success && response.data.data?.length) {
        setList(response.data.data);
        setIsLocalData(false);
        return;
      }
    } catch (error) {
      // Fall back to local JSON data when API is unavailable.
    }
    setList(menuData.food_list);
    setIsLocalData(true);
  }

  const removeFood = async (foodId) => {
    if (isLocalData) return;
    const response = await axios.post(`${url}/api/food/remove`, {
      id: foodId
    })
    await fetchList();
    if (response.data.success) {
      toast.success(response.data.message);
    }
    else {
      toast.error("Error")
    }
  }

  useEffect(() => {
    fetchList();
  }, [])

  return (
    <div className='list add flex-col'>
      <p>All Foods List</p>
      <div className='list-table'>
        <div className="list-table-format title">
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b>Action</b>
        </div>
        {list.map((item, index) => {
          const imageUrl = item.image?.startsWith("http") || item.image?.startsWith("/")
            ? item.image
            : `${url}/images/${item.image}`;
          return (
            <div key={index} className='list-table-format'>
              <img src={imageUrl} alt="" />
              <p>{item.name}</p>
              <p>{item.category}</p>
              <p>{currency}{item.price}</p>
              <p className={isLocalData ? '' : 'cursor'} onClick={() => removeFood(item._id)}>
                {isLocalData ? '-' : 'x'}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default List
