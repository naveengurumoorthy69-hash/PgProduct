# Supabase Authentication Setup Guide

This application is ready to be integrated with Supabase for production-grade authentication and database management. Follow these steps to set up Supabase Auth.

## Step 1: Create a Supabase Project
1. Go to [Supabase](https://supabase.com/) and sign in or create an account.
2. Click **New Project** and select your organization.
3. Enter a project name and a strong database password.
4. Choose a region close to your users and click **Create New Project**.

## Step 2: Get Your API Keys
1. Once your project is created, go to the **Project Settings** (the gear icon on the left sidebar).
2. Click on **API** in the sidebar.
3. Copy the **Project URL** and the **`anon` `public` API Key**.

## Step 3: Configure Environment Variables
1. In the root directory of this project, create a file named `.env` (you can copy the `.env.example` file).
2. Add your Supabase URL and Anon Key to the `.env` file:
   ```env
   VITE_SUPABASE_URL=your_project_url_here
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

## Step 4: Run the Database Schema (Optional for Auth, Required for Data)
1. Go to the **SQL Editor** in your Supabase dashboard.
2. Copy the contents of the `supabase_schema.sql` file provided in this project.
3. Paste it into the SQL Editor and click **Run**. This will create all the necessary tables for your PG Manager app.

## Step 5: Test the Login
1. Start your application.
2. Go to the login page.
3. Since you added the `.env` variables, the app will automatically switch from "Mock Local Storage Mode" to "Supabase Auth Mode".
4. You will now see a **Password** field and a toggle to switch between **Sign In** and **Sign Up**.
5. Create a new account using the **Sign Up** option. Your user will appear in the Supabase dashboard under **Authentication > Users**.

## Note on Email Verification
By default, Supabase requires email verification. When you sign up, it will send a confirmation email. 
*   **For testing:** You can disable "Confirm email" in your Supabase dashboard under **Authentication > Providers > Email**. This allows you to sign in immediately after signing up without checking your email.
