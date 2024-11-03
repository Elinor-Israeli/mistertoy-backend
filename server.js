import path from 'path'
import cors from 'cors'
import express from 'express'
import cookieParser from 'cookie-parser'

import { toyService } from './services/toy.service.js'
// import { userService } from './services/user.service.js'
import { loggerService } from './services/logger.service.js'

const app = express()

const corsOptions = {
    origin: [
        'http://127.0.0.1:8080',
        'http://localhost:8080',
        'http://127.0.0.1:5173',
        'http://localhost:5173'
    ],
    credentials: true
}

// Express Config:
app.use(express.static('public'))
app.use(cookieParser())
app.use(express.json())
app.use(cors(corsOptions))

// Express Routing:

// REST API for Toys
app.get('/api/toy', (req, res) => {
    const filterBy = {
        txt: req.query.txt || '',
        minSpeed: +req.query.minSpeed || 0,
        maxPrice: +req.query.maxPrice || 0,
        pageIdx: req.query.pageIdx || undefined,
    }
    toyService.query(filterBy)
        .then(toys => res.send(toys))
        .catch(err => {
            loggerService.error('Cannot get toys', err)
            res.status(400).send('Cannot get toys')
        })
})

app.get('/api/toy', (req, res) => {

    const { txt, inStock = null, pageIdx, sortBy, labels = [] } = req.query
  
    const filterBy = { txt, inStock, pageIdx: +pageIdx, sortBy, labels }
  
    console.log('filterBy:', filterBy)
    toyService.query(filterBy)
      .then(toys => {
        res.send(toys)
      })
      .catch(err => {
        loggerService.error('Cannot load toys', err)
        res.status(500).send('Cannot load toys')
      })
  })
  app.get('/api/toy/:toyId', (req, res) => {

    const { toyId } = req.params
  
    toyService.get(toyId)
      .then(toy => {
        res.send(toy)
      })
      .catch(err => {
        loggerService.error('Cannot get toy', err)
        res.status(500).send(err)
      })
  })
   
  app.post('/api/toy', (req, res) => {

    const { name, price, labels } = req.body
    const toy = {
      name,
      price: +price,
      labels,
    }
  
    toyService.save(toy)
      .then(savedToy => {
        res.send(savedToy)
      })
      .catch(err => {
        loggerService.error('Cannot add toy', err)
        res.status(500).send('Cannot add toy')
      })
  })

  app.put('/api/toy', (req, res) => {

    const { name, price, _id, labels } = req.body
    const toy = {
      _id,
      name,
      price: +price,
      labels,
    }
  
    toyService.save(toy)
      .then(savedToy => {
        res.send(savedToy)
      })
      .catch(err => {
        loggerService.error('Cannot update toy', err)
        res.status(500).send('Cannot update toy')
      })
  })

  app.delete('/api/toy/:toyId', (req, res) => {

    const { toyId } = req.params
  
    toyService.remove(toyId)
      .then(msg => {
        res.send({ msg, toyId })
      })
      .catch(err => {
        loggerService.error('Cannot delete toy', err)
        res.status(500).send('Cannot delete toy, ' + err)
      })
  })

// User API
app.get('/api/user', (req, res) => {
    userService.query()
        .then(users => res.send(users))
        .catch(err => {
            loggerService.error('Cannot load users', err)
            res.status(400).send('Cannot load users')
        })
})



app.get('/api/user/:userId', (req, res) => {
    const { userId } = req.params

    userService.getById(userId)
        .then(user => res.send(user))
        .catch(err => {
            loggerService.error('Cannot load user', err)
            res.status(400).send('Cannot load user')
        })
})

// Auth API
app.post('/api/auth/login', (req, res) => {
    const credentials = req.body

    userService.checkLogin(credentials)
        .then(user => {
            if (user) {
                const loginToken = userService.getLoginToken(user)
                res.cookie('loginToken', loginToken)
                res.send(user)
            } else {
                res.status(401).send('Invalid Credentials')
            }
        })
})

app.post('/api/auth/signup', (req, res) => {
    const credentials = req.body
    userService.save(credentials)
        .then(user => {
            if (user) {
                const loginToken = userService.getLoginToken(user)
                res.cookie('loginToken', loginToken)
                res.send(user)
            } else {
                res.status(400).send('Cannot signup')
            }
        })
})

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('loginToken')
    res.send('logged-out!')
})


app.put('/api/user', (req, res) => {
    const loggedinUser = userService.validateToken(req.cookies.loginToken)
    if (!loggedinUser) return res.status(400).send('No logged in user')
    const { diff } = req.body
    if (loggedinUser.score + diff < 0) return res.status(400).send('No credit')
    loggedinUser.score += diff
    return userService.save(loggedinUser).then(user => {
        const token = userService.getLoginToken(user)
        res.cookie('loginToken', token)
        res.send(user)
    })
})


// Fallback route
app.get('/**', (req, res) => {
    res.sendFile(path.resolve('public/index.html'))
})

const PORT = process.env.PORT || 3030
app.listen(PORT, () =>
    loggerService.info(`Server listening on port http://127.0.0.1:${PORT}/`)
)
