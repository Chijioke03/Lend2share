## Frontend Integration (Basic Example)

You can connect any frontend (React, Vue, plain JS) using fetch:

### Signup
```js
fetch("http://localhost:3000/api/auth/signup", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@test.com",
    phone: "1234567890",
    password: "SecureP@ss1"
  })
});


##Login
fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    email: "jane@test.com",
    password: "SecureP@ss1"
  })
});