import $ from 'jquery';
import { debounce } from './utils/debounce.js';
import { ajaxFetch } from './utils/ajaxFetch.js';
import { weatherData } from './utils/weatherData.js';
import { formatWeatherTime } from './utils/formatTime.js';

// open search menu into document
$('#search-menu-opener').on('click', () => {
    const searchBoxContainer = $('#search-box-container');

    if (searchBoxContainer.hasClass('translate-y-[-150%]')) {
        searchBoxContainer.removeClass('translate-y-[-150%]');
        searchBoxContainer.addClass('translate-y-[0]');
    }
});

const closeSearchBoxHandle = () => {
    const searchBoxContainer = $('#search-box-container');

    if (searchBoxContainer.hasClass('translate-y-[0]')) {
        searchBoxContainer.addClass('translate-y-[-150%]');
        searchBoxContainer.removeClass('translate-y-[0]');
    }
};

// close search menu into document
$('#search-menu-closer').on('click', closeSearchBoxHandle);

// variables
const GEO_BASE_URL = import.meta.env.VITE_GEO_BASE_URL;
const GEO_API_KEY = import.meta.env.VITE_GEO_API_KEY;
const WEATHER_URL = import.meta.env.VITE_OPEN_METEO_URL;

let activeCoordinates = {
    lat: (13.0843).toFixed(2),
    lon: (80.2705).toFixed(2)
};

let timezone = {
    name: "Asia/Kolkata",
    offsetseconds: 19800,
    offset: '+05:30'
};

// get weather api along with lat and lon
const getWeatherAPI = (lat, lon) => {
    const apiURL = `${WEATHER_URL}?latitude=${lat}&longitude=${lon}&daily=sunset,sunrise,uv_index_max,weather_code&current=relative_humidity_2m,temperature_2m,apparent_temperature,wind_speed_10m,is_day,weather_code,uv_index`;

    return apiURL;
};

// async fetch handle
const asyncFetchHandle = async (url, callback) => {
    const { response, error } = await ajaxFetch(url, 'GET');

    if (response) {
        callback(response);
    } else {
        console.log(`Error fetching area from geocode api, ${error}`);
    }
};

// render ui which is area from geocode api
const renderAreaHandle = (areas) => {
    const areaFeatures = areas.features;

    $('#area-container').html('');

    if ($('#search-input').val() == '') {
        $('#area-container').removeClass('flex');
        $('#area-container').addClass('hidden');
        return;
    }

    if (!areaFeatures || areaFeatures.length == 0) {
        $('#area-container').removeClass('hidden');
        $('#area-container').addClass('flex');
        $('#area-container').html('No areas found');
        return;
    }

    let htmlContent = '';

    areaFeatures.forEach(area => {
        htmlContent += `
        <p class="search-suggestion">${area.properties.formatted}</p>
        `;
    });

    $('#area-container').removeClass('hidden');
    $('#area-container').addClass('flex');
    $('#area-container').html(htmlContent);
};

// search area lattitude and longtitude
const searchAreaGeocode = async (searchTerm) => {
    if (searchTerm) {
        asyncFetchHandle(`${GEO_BASE_URL}/search?text=${searchTerm.trim().toLowerCase()}&apiKey=${GEO_API_KEY}`, renderAreaHandle);
    }
};

// debounce search method
const debounceSearch = debounce(searchAreaGeocode, 500);

// getting while type search word
$('#search-input').on('input', () => {
    const searchInput = $('#search-input').val();
    if (!searchInput || searchInput.length <= 2 || searchInput === '') return;
    $('#area-container').removeClass('hidden');
    $('#area-container').addClass('flex');
    $('#area-container').html('Loading areas...');
    debounceSearch(searchInput);
});

// area search while clicking
$('#area-container').on('click', (e) => {
    const areaEl = e.target;

    if (areaEl.classList.contains('search-suggestion')) {
        const encodedArea = encodeURIComponent(areaEl.textContent);
        asyncFetchHandle(`${GEO_BASE_URL}/search?text=${encodedArea}&apiKey=${GEO_API_KEY}`, fetchAreaHandle);

        $('#area-container').removeClass('flex');
        $('#area-container').addClass('hidden');
        $('#search-input').val('');

        closeSearchBoxHandle();
    }
});

// fetch area geocode such as lattitude and longtitude
const fetchAreaHandle = (area) => {
    const latitude = area.features[0].properties.lat.toFixed(2);
    const longitude = area.features[0].properties.lon.toFixed(2);

    // save coordinates
    activeCoordinates.lat = latitude;
    activeCoordinates.lon = longitude;

    // save timezone
    timezone.name = area.features[0].properties.timezone.name;
    timezone.offset = area.features[0].properties.timezone.offset_STD;
    timezone.offsetseconds = area.features[0].properties.timezone.offset_STD_seconds;

    // get area details in object
    const county = {
        city: area.features[0].properties.city ? area.features[0].properties?.city : null,
        state: area.features[0].properties.state ? area.features[0].properties?.state : null,
        district: area.features[0].properties.state_district ? area.features[0].properties?.state_district : null,
        country: area.features[0].properties.country ? area.features[0].properties?.country : null
    };

    const locationString = `${county.city ? `${county.city}, ` : ''}${county.district ? `${county.district}, ` : ''}${county.state ? `${county.state}, ` : ''}${county.country ? `${county.country}` : ''}`;

    $('#weather-location').text(locationString);

    // fetch weather details at specific area
    const areaWeather = getWeatherAPI(latitude, longitude);
    asyncFetchHandle(areaWeather, fetchWeatherDetails);
};

/***** area search and assign lattitude and logtitude ends here *****/

$('document').ready(() => {
    // get chennai details first
    const areaWeather = getWeatherAPI(activeCoordinates.lat, activeCoordinates.lon);
    asyncFetchHandle(areaWeather, fetchWeatherDetails);

    // update date and time
    updateDateTime();
    setInterval(updateDateTime, 1000);

    //updating weather every 1 minute
    setInterval(() => {
        const currentAreaWeather = getWeatherAPI(activeCoordinates.lat, activeCoordinates.lon);
        asyncFetchHandle(currentAreaWeather, fetchWeatherDetails);
    }, 60000);
});

// render the ui based on weather data
const fetchWeatherDetails = (weather) => {
    // finding weather code
    const weather_code = weather.daily.weather_code[0];
    const weatherDetail = weatherData.find(w => w.weatherCode === weather_code);

    $('#weather-temperature').text(`${weather.current.temperature_2m}°`);
    $('#weather-windspeed').text(weather.current.wind_speed_10m);
    $('#weather-humidity').text(weather.current.relative_humidity_2m);
    $('#weather-sunrise').text(formatWeatherTime(weather.daily.sunrise[0], timezone.offsetseconds));
    $('#weather-sunset').text(formatWeatherTime(weather.daily.sunset[0], timezone.offsetseconds));
    $('#weather-uvindex').text(weather.current.uv_index);

    if (weatherDetail) {
        $('#weather-title').text(weatherDetail.weather);
        $('#weather-condition').text(`${weatherDetail.condition} locks today’s vibe`);
        $('#weather-details').text(weatherDetail.detail);
        $('#weather-video').attr('src', weatherDetail.background);
    } else {
        $('#weather-title').text('Normal weather');
        $('#weather-condition').text('Depends upon temperature');
        $('#weather-details').text('Weather condition not available for this particular area');
        $('#weather-video').attr('src', "/videos/normal.mp4");
    }
};

// update navbar date and time
const updateDateTime = () => {
    const now = new Date();

    // format date
    const dateOptions = { day: 'numeric', month: 'long' };
    const formattedDate = new Intl.DateTimeFormat('en-IN', dateOptions).format(now);

    // format time
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    let formattedTime = new Intl.DateTimeFormat('en-IN', timeOptions).format(now);

    formattedTime = formattedTime.toUpperCase();

    $('#date-time').html(`${formattedDate} | ${formattedTime}`);
};


