const http = require('http');
const express = require('express');
const NodeCache = require('node-cache');
const app = express();
const cache = new NodeCache({ stdTTL: 300 }); // Cache 5 menit
const PORT = 3000;
const OMDB_API_KEY = 'bb189ce2';


app.use(express.json());

function httpGet(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (response) => {
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (error) {
                    reject(new Error('Failed to parse JSON'));
                }
            });
        }).on("error", (err) => {
            reject(err);
        });
    });
}


const getData = async (key, url, res) => {
    const cachedData = cache.get(key);
    if (cachedData) {
        res.json(cachedResponse);
    } else {
        const response = await httpGet(url);
        cache.set(key, response);
        return response;
    }
};

app.get('/movie/popular', async (req,res) => {
    const key = 'popular_2024';
    const url = `http://www.omdbapi.com/?s=movie&y=2024&apikey=${OMDB_API_KEY}`;
    try {
        const data = await getData(key,url,res);
        let transformedData;
        if (data.Response === 'True') {
            transformedData = data.Search.map(movie => ({
                id: movie.imdbID,
                title: movie.Title,
                year: movie.Year,
                poster: movie.Poster
            }));
        } else {
            transformedData = data.Search.map(movie => ({
                message: movie.Error
            }));
        }

        res.json(transformedData);
    } catch (error) {
        res.status(500).send('Error fetching popular movies');
    }

});


app.get('/movie/detail/:id', async (req, res) => {
    const { id } = req.params;
    const key = `detail_${id}`;
    const url = `http://www.omdbapi.com/?i=${id}&apikey=${OMDB_API_KEY}`;

    try {
        const data = await getData(key, url,res);
        let transformedData;
        if (data.Response == 'True') {
            transformedData = {
                title: data.Title,
                year: data.Year,
                poster: data.Poster,
                plot: data.Plot,
                director: data.Director,
                actors: data.Actors
            };
        } else {
            transformedData = {
                messsage: data.Error
            }
        }
        res.json(transformedData);
    } catch (error) {
        res.status(500).send('Error fetching movie details');
    }
});

app.get('/movie/search', async (req, res) => {
    const { query } = req.query;
    const key = `search_${query}`;
    const url = `http://www.omdbapi.com/?s=${query}&apikey=${OMDB_API_KEY}`;

    try {
        const data = await getData(key, url, res);
        if (data.Response === 'True') {
            transformedData = data.Search.map(movie => ({
                title: movie.Title,
                year: movie.Year,
                poster: movie.Poster,
                actors: movie.Actors
            }));
        } else {
            transformedData = data.Search.map(movie => ({
                message: movie.Error
            }));
        }
        res.json(transformedData);
    } catch (error) {
        res.status(500).send('Error searching for movies');
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});