import axios from "axios";
import { showAlert } from "./alerts";
//const stripe = Stripe('pk_test_TYooMQauvdEDq54NiTphI7jx');
let stripe;
const getStripe=()=>{
  if(!stripe){
    const stripeJs = /** @type {any} */ (window).Stripe;

    if(typeof stripeJs !== 'function'){
      throw new Error('Stripe.js has not loaded on this page.');
  
  }
  stripe = stripeJs('pk_test_51TespXRqHGGpzfbEZyYC4inCKHRCcHjIH89jc476a2n5CDBNH7MvtGEZX9w8G5VvWr9fe4YcruRFyoIjAlB7Cv8f00umnV2G6P')
}
return stripe;
}
export const bookTour = async tourId =>{
    //1 ) get checkout session from API

  try {
    // 1) Get checkout session from API
    const session = await axios(
      `/api/v1/booking/checkout-session/${tourId}`
    );
    console.log(session);

    // 2) Create checkout form + chanre credit card
    await getStripe().redirectToCheckout({
      sessionId: session.data.session.id
      
    });
   
  } catch (err) {
    console.log(err);
    showAlert('error', err.response?.data?.message || err.message);
  }
};