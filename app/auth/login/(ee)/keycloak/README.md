# 🧩 Keycloak Setup Guide

This document explains how to set up a **local Keycloak server** and configure it for OAuth login in your app.  
For more details, see the [official Keycloak documentation](https://www.keycloak.org/getting-started/getting-started-podman).
By the end of this guide, you'll have the following environment variables ready:

```bash
KEYCLOAK_ID= ( Keycloak oauth id )
KEYCLOAK_SECRET= ( Keycloak oauth secret )
KEYCLOAK_ISSUER=http://localhost:8080/realms/goovee ( Keycloak oauth issuer including realm )
```

---

## 🚀 1. Start Keycloak Locally

Run the following command to start Keycloak in development mode:

```bash
podman run -p 127.0.0.1:8888:8080   -e KC_BOOTSTRAP_ADMIN_USERNAME=admin   -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin   quay.io/keycloak/keycloak:26.4.1 start-dev
```

> 🔸 If you want to use a different port (e.g. `8180`), change the host port:
>
> ```bash
> podman run -p 127.0.0.1:8180:8080 ...
> ```
>
> Then access Keycloak at [http://localhost:8180](http://localhost:8180).

---

## 🔑 2. Access the Admin Console

Once Keycloak starts, open:

👉 [http://localhost:8888](http://localhost:8888)

Log in with:

```
Username: admin
Password: admin
```

---

## 🏗 3. Create a Realm

A **realm** represents a security domain (like a project or tenant).

1. In the **top-left dropdown**, click **“Add realm”**.
2. Enter the name `goovee`.
3. Click **Create**.

You’ll now be inside the new `goovee` realm.

---

## 👤 4. Create a User

1.  Go to **Users** in the left menu and click **Add user**.
2.  Fill in the required user details (e.g., **Username**, **Email**).
3.  Click **Create**.
4.  Once the user is created, go to the **Credentials** tab.
5.  Set a password for the user and confirm it.
6.  Make sure to turn off the **Temporary** switch if you want the password to be permanent.
7.  Click **Set password** to save it.

---

## ⚙️ 5. Create a Client (Your App)

1. Go to **Clients** → click **Create client**.
2. Fill in:
   - **Client type:** `OpenID Connect`
   - **Client ID:** `goovee-app`
3. Click **Next**.

4. In **Capability config**, enable:

   - ✅ Client authentication
   - (Optional) Authorization
   - Leave others default  
     → Click **Next**.

5. In **Login settings**, configure:

   - **Valid redirect URIs:**

     ```
     http://localhost:3000/*
     ```

     (Adjust to your app's login callback URL)

   - **Web origins:**

     ```
     *
     ```

     (You can restrict this later in production)

   - Click **Save**.

---

## 🔐 6. Get Client Credentials

After saving the client:

1. Open the **Credentials** tab.
2. Copy:
   - **Client ID** → `KEYCLOAK_ID`
   - **Client secret** → `KEYCLOAK_SECRET`

---

## 🌐 7. Find Your Issuer URL

Your issuer URL is based on the realm you created.

For the realm `goovee`, it is:

```
KEYCLOAK_ISSUER=http://localhost:8888/realms/goovee
```

Verify it by visiting:

👉 [http://localhost:8888/realms/goovee/.well-known/openid-configuration](http://localhost:8888/realms/goovee/.well-known/openid-configuration)

You should see a JSON response describing the realm and endpoints.

---

## 📄 8. Example `.env` Configuration

Your `.env` file should look like this:

```bash
KEYCLOAK_ID=goovee-app
KEYCLOAK_SECRET=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
KEYCLOAK_ISSUER=http://localhost:8888/realms/goovee

# Show / hide login with Keycloak
SHOW_KEYCLOAK_OAUTH=true

# configuration to allow / disallow creating partner on new login
KEYCLOAK_CREATE_USER_ON_LOGIN=true

# button label for keycloak oauth e.g "Login with altered"
GOOVEE_PUBLIC_KEYCLOAK_OAUTH_BUTTON_LABEL=Log In with Keycloak

# image icon for keycloak oauth button e.g '/images/altered.svg' for branding - place it in public/images folder
GOOVEE_PUBLIC_KEYCLOAK_OAUTH_BUTTON_IMAGE=/images/keycloak.svg
```

---

## 🧠 Notes

- The **left port** in `-p host_port:container_port` controls what you use to access Keycloak locally.
- The **right port** (`8080`) is Keycloak’s internal port and should not be changed unless you set `KC_HTTP_PORT`.
- You can create multiple clients for different apps (web, mobile, etc.).
- For production, you should:
  - Use HTTPS.
  - Restrict redirect URIs.
  - Use a persistent database (PostgreSQL or MySQL).

---

✅ **You’re now ready to integrate Keycloak OAuth into your app!**
