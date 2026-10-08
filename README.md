# ByteCart

ByteCart is a static HTML, CSS, and JavaScript storefront that uses Supabase for authentication, database access, and uploaded media. It can be hosted on GitHub Pages; PHP or a separate PHP server is not required.

## Supabase setup

1. Open the Supabase project's **SQL Editor**, paste in `supabase.sql`, and run it.
   Existing projects that have already run the base schema should run `login-events.sql` once to enable login activity recording and admin history.
2. In **Authentication → URL Configuration**, set the site URL to `https://baceloniagabriel116-dotcom.github.io/byte-carts/` and add `https://baceloniagabriel116-dotcom.github.io/byte-carts/**` to the allowed redirect URLs. Add a local preview URL there too if you test locally. Signup requests also pass the current page as the confirmation redirect, so confirmation links return to the site instead of `localhost:3000`.
3. Register the account that will administer the store. In the SQL Editor, promote it with:

   ```sql
   update public.profiles
   set role = 'admin'
   where email = 'your-email@example.com';
   ```

4. Sign out and back in after changing the role.

Newly registered accounts receive the `user` role. To grant the `admin` role, run the SQL update above from the Supabase SQL Editor; never let a public signup or browser request assign itself administrator access.

To add or seed the catalog products in an existing Supabase project, run `products.sql` in the SQL Editor. It uses PostgreSQL syntax and can be run again without creating duplicate slugs. Fresh setups also seed the same catalog from `supabase.sql`.

The publishable key in `js/database.js` is intended for browser use. Do not place a Supabase secret or service-role key in this repository.

## GitHub Pages deployment

The workflow in `.github/workflows/deploy-pages.yml` publishes the HTML pages and required assets when commits are pushed to `main`. It excludes SQL setup files, local-only files, and admin-uploaded media from the deployed site.

After pushing the project to a GitHub repository:

1. Push to `main` or run **Deploy static site to GitHub Pages** from the Actions tab. The workflow configures Pages and deploys the site.
2. If GitHub asks for a deployment source, choose **GitHub Actions** under **Settings → Pages**.
3. Wait for the Pages deployment job to finish, then open the URL shown in the `github-pages` environment.

The root `index.html` is the site homepage. Navigation links use `.html` pages so they work on static hosting.
