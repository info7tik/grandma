# Grandma

Manage your cooking recipes.

## Development Workflow

### First build
```
npx ng build
npx cap add android
```

### Update the Android application after modifying the Angular sources
After modifying the Angular sources, start by build the Angular application:
```
ng build
```
Then, update the Android sources:
```
npx cap sync
```
In Android Studio, open the `grandma/android` directory and run the application on your phone.
