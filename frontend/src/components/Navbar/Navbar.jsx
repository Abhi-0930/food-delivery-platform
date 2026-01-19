import React, { useContext, useEffect, useRef, useState } from 'react'
import './Navbar.css'
import { assets } from '../../assets/assets'
import { Link, useNavigate } from 'react-router-dom'
import { StoreContext } from '../../Context/StoreContext'

const Navbar = ({ setShowLogin }) => {

  const [menu, setMenu] = useState("home");
  const { getTotalCartAmount, token, setToken, searchQuery, setSearchQuery, menu_list } = useContext(StoreContext);
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef(null);
  const [placeholderText, setPlaceholderText] = useState("Search for ");

  useEffect(() => {
    if (!menu_list?.length) return;
    const prefix = "Search for ";
    const placeholders = menu_list.map((item) => item.menu_name.toLowerCase());
    let index = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timeoutId;

    const type = () => {
      const current = placeholders[index] || "cakes";
      const nextText = prefix + current.slice(0, charIndex);
      setPlaceholderText(nextText);

      if (!isDeleting) {
        if (charIndex < current.length) {
          charIndex += 1;
          timeoutId = setTimeout(type, 70);
        } else {
          isDeleting = true;
          timeoutId = setTimeout(type, 900);
        }
      } else {
        if (charIndex > 0) {
          charIndex -= 1;
          timeoutId = setTimeout(type, 40);
        } else {
          isDeleting = false;
          index = (index + 1) % placeholders.length;
          timeoutId = setTimeout(type, 300);
        }
      }
    };

    type();
    return () => clearTimeout(timeoutId);
  }, [menu_list]);

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    navigate('/')
  }

  return (
    <div className='navbar'>
      <Link to='/'><img className='logo' src={assets.logo} alt="" /></Link>
      <ul className="navbar-menu">
        <Link to="/" onClick={() => setMenu("home")} className={`${menu === "home" ? "active" : ""}`}>Home</Link>
        <a href='#explore-menu' onClick={() => setMenu("menu")} className={`${menu === "menu" ? "active" : ""}`}>Menu</a>
        <Link to="/myorders" onClick={() => setMenu("orders")} className={`${menu === "orders" ? "active" : ""}`}>Orders</Link>
        <a href='#footer' onClick={() => setMenu("contact")} className={`${menu === "contact" ? "active" : ""}`}>Contact Us</a>
      </ul>
      <div className="navbar-right">
        <div className={`navbar-search ${isSearchOpen ? 'open' : ''}`}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder={placeholderText}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="navbar-search-input"
          />
          <button
            type="button"
            className="navbar-search-close"
            onClick={() => {
              setIsSearchOpen(false);
              setSearchQuery("");
            }}
            aria-label="Close search"
          >
            ×
          </button>
          <button
            type="button"
            className="navbar-search-btn"
            onClick={() => {
              setIsSearchOpen(true);
              setTimeout(() => searchInputRef.current?.focus(), 0);
            }}
          >
            <img src={assets.search_icon} alt="Search" />
          </button>
        </div>
        <Link to='/cart' className='navbar-search-icon'>
          <img src={assets.basket_icon} alt="" />
          <div className={getTotalCartAmount() > 0 ? "dot" : ""}></div>
        </Link>
        {!token ? <button onClick={() => setShowLogin(true)}>Sign In</button>
          : <div className='navbar-profile'>
            <img src={assets.profile_icon} alt="" />
            <ul className='navbar-profile-dropdown'>
              <li onClick={()=>navigate('/myorders')}> <img src={assets.bag_icon} alt="" /> <p>Orders</p></li>
              <hr />
              <li onClick={logout}> <img src={assets.logout_icon} alt="" /> <p>Logout</p></li> 
            </ul>
          </div>
        }

      </div>
    </div>
  )
}

export default Navbar
