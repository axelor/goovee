import axios from 'axios';
import {USERS_API_ENDPOINT} from './path-helpers';
import {getHOST} from '../utils';

export const getMmuser = async (
  email: string | undefined,
  token: string | undefined,
) => {
  try {
    const {data} = await axios.get(
      `${getHOST()}${USERS_API_ENDPOINT}/email/${email}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return {data};
  } catch (error) {
    console.error("Erreur lors de l'authentification: ", error);
    throw error;
  }
};
