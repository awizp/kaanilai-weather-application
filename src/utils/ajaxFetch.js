import $ from 'jquery';

export const ajaxFetch = async (url, method) => {
    try {
        const response = await $.ajax({ url, method });
        return { response, error: null };
    } catch (error) {
        return { response: null, error };
    }
};