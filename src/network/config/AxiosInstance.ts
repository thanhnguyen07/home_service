import axios from 'axios';
// import {showToast} from '~/utils/helper';
import APIConstants from './APIConstants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import refreshTokenRequest from '../requests/refreshTokenRequest';

async function getAxiosInstance() {
    const instance = axios.create({
        baseURL: APIConstants.BASE_URL,
        timeout: 30000,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    });

    instance.interceptors.request.use(
        async (config: any) => {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                config.headers.Authorization = 'Bearer ' + token;
            }
            return config;
        },
        error => {
            return Promise.reject(error);
        },
    );

    instance.interceptors.response.use(
        res => {
            return res;
        },
        async err => {
            const originalConfig = err.config;
            if (originalConfig.url !== '/auth/signin' && err.response) {
                if (err.response.status === 401 && !originalConfig._retry) {
                    originalConfig._retry = true;
                    try {
                        const callRefreshTokenRequest =
                            await refreshTokenRequest();
                        const newToken = callRefreshTokenRequest.data?.token!;
                        await AsyncStorage.setItem('token', newToken);
                        return instance(originalConfig);
                    } catch (_error) {
                        return Promise.reject(_error);
                    }
                }
            }
            return Promise.reject(err);
        },
    );
    return instance;
}
export default getAxiosInstance;