import axios from 'axios';
import { showAlert } from './alerts';

export const updateSettings = async (data,type) => {
  try {
    const url = type === 'password' ? '/api/v1/users/updatePassword':'/api/v1/users/updateMe'
      console.log('URL:', url);
    const res = await axios({
      method: 'PATCH',
      url,
      data
    });
        console.log('RESPONSE:', res);
    if(res.data.status === 'success'){
        showAlert('success',`${type.toUpperCase()} updated successfully`)
    }
   
   
  } catch (err) {
    console.log('ERROR:', err);
    showAlert('error', err.response.data.message);
  }
};
 