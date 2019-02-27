import * as firebase from 'firebase/app';
import 'firebase/auth';

window.firebase = firebase;

export class Auth {
  constructor(firebaseConfig, upgradeTokenUrl, cookieName) {
    this.firebaseConfig = firebaseConfig;
    this.app = firebase.initializeApp(this.firebaseConfig);
    this.upgradeTokenUrl = upgradeTokenUrl;
    this.cookieName = cookieName;
    
    this.providers = {
      google: {
        getProvider: function() { return new firebase.auth.GoogleAuthProvider(); },
        scopes: [ 'email' ],
        label: 'Google'
      },
      facebook: {
        getProvider: function() { return new firebase.auth.FacebookAuthProvider(); },
        scopes: [ 'email' ],
        label: 'Facebook'
      },
      twitter: {
        getProvider: function() { return new firebase.auth.TwitterAuthProvider(); },
        label: 'Twitter'
      },
      github: {
        gitProvider: function() { return new firebase.auth.GithubAuthProvider(); },
        scopes: [ 'user:email' ],
        label: 'Github'
      }
    }
  }
 
  currentUser() {
    return new Promise((resolve, reject) => {
      try {
        this.app.auth().onAuthStateChanged((user) => {
          resolve(user);
        });
      } catch(err) {
        return null;
      }
    });
  }

  async signInEmailPassword(email, password) {
    try {
      await this.sessionCleanup();

      console.log('Signing in as', email);
      const userCredentials = await this.app.auth().signInWithEmailAndPassword(email, password);

      if (!userCredentials) {
        throw new Error('Something went wrong, signed in but no user?');
      }
      
      const user = await this.initialiseSession(userCredentials);
      return user;
    } catch(err) {
      console.error('Failed to sign in using email and password',  err);
      throw err;
    }
  }

  async signInProvider(providerName) {
    try {
      await this.sessionCleanup();

      console.log('Finding Provider', providerName, 'in', this.providers);
      const providerInfo = this.providers[providerName];
      const provider = providerInfo.getProvider();
      if (providerInfo.scopes) {
        providerInfo.scopes.forEach(function(scope) {
          provider.addScope(scope);
        });
      }
        
      console.log('Signing in with', provider);
      const userCredentials = await this.app.auth().signInWithPopup(provider);
      
      if (!userCredentials) {
        throw new Error('Something went wrong, signed in but no user?');
      }

      const user = await this.initialiseSession(userCredentials);
      return user;
    } catch(err) {
      console.error('Failed to sign in using provider', providerName, err);
      throw err;
    }
  }

  async createAccount(email, emailConfirm, password, passwordConfirm) {
    try {
      await this.sessionCleanup();
      
      if (email.toLowerCase() !== emailConfirm.toLowerCase()) {
        throw new Error('The two email addresses entered do not match');
      }

      if (password !== passwordConfirm) {
        throw new Error('The two passwords entered do not match');
      }

      console.log('Creating user with email', email);
      const userCredentials = await this.app.auth().createUserWithEmailAndPassword(email, password);

      if (!userCredentials) {
        throw new Error('Something went wrong, signed in but no user?');
      }

      const user = await this.initialiseSession(userCredentials);
      return user;
    } catch(err) {
      console.error('Failed to create account', err);
      throw err;
    }
  }

  async initialiseSession(userCredentials) {
    try {
      console.log('Getting Id Token result for', userCredentials);
      const idToken = await userCredentials.user.getIdTokenResult();
      if (!idToken) {
        throw new Error('Failed to get Id Token');
      }

      console.log('Upgrading Id Token for Session Cookie', idToken);
      const user = await this.upgradeIdToken(idToken.token);
      if (!user) {
        throw new Error('Something went wrong upgrading id token');
      }

      console.log('All done and we have user', user);
      return user;
    } catch (err) {
      console.error('Failed to initialise session', err);
      throw err;
    }
  }

  async sessionCleanup() {
    try {
      console.log('Cleaning up any lingering sessions');
      const currentUser = await this.currentUser();
      if (currentUser) {
        await this.app.auth().signOut();
      }
    } catch(err) {
      console.error('Problem signing out in session cleanup', err);
    }
    document.cookie = this.cookieName + '=; Max-Age=-99999999; path=/; secure';
    return true;
  }

  upgradeIdToken(idToken) {
    return new Promise((resolve, reject) => {
      const url = this.upgradeTokenUrl.replace('{idToken}', idToken);
      console.log('About to ajax upgrade token', url);
      $.getJSON(url, (data, status, xhr) => {
        console.log('Request successful', url, arguments);
        resolve(data);
      }).fail((data, status, xhr) => {
        console.error('Failed request', url, arguments);
        reject(data);
      });
    });
  }

  async sendPasswordReset(email) {
    try {
      console.log('Requesting password reset email for', email);
      await this.app.auth().sendPasswordResetEmail(email);
      return true;
    } catch(err) {
      console.error('Failed to request password reset email', err);
      throw err;
    }
  }

  async changePassword(password, passwordConfirm) {
    try {
      const currentUser = await this.currentUser();
      if (!currentUser) throw new Error('Not signed in');
      
      if (password !== passwordConfirm) {
        throw new Error('The two passwords entered do not match');
      }

      await currentUser.updatePassword(password);

      return true;
    } catch(err) {
      console.error('Failed to change password', err);
      throw err;
    }
  }

  async linkWithProvider(providerName) {
    try {
      const currentUser = await this.currentUser();
      if (!currentUser) throw new Error('Not signed in');

      const providerInfo = this.providers[providerName];
      const provider = providerInfo.getProvider();
      if (providerInfo.scopes) {
        providerInfo.scopes.forEach(function(scope) {
          provider.addScope(scope);
        });
      }

      const userCredentials = await currentUser.linkWithPopup(provider);
      const user = await this.initialiseSession(userCredential);

      return user;
    } catch(err) {
      console.error('Failed to link with provider', providerName, err);
      throw err;
    }
  }

  async unlinkFromProvider(providerName) {
    try {
      const currentUser = await this.currentUser();
      if (!currentUser) throw new Error('Not signed in');

      const providerInfo = this.providers[providerName];
      const provider = providerInfo.getProvider();
      if (providerInfo.scopes) {
        providerInfo.scopes.forEach(function(scope) {
          provider.addScope(scope);
        });
      }

      const user = currentUser.unlink(provider.providerId);
    } catch(err) {
      console.error('Failed to unlink from provider', providerName, err);
      throw err;
    }
  }

  async deleteUser() {
    try {
      const currentUser = await this.currentUser();
      if (!currentUser) throw new Error('Not signed in');

      await currentUser.delete();
      await this.sessionCleanup();
      return true;
    } catch(err) {
      console.error('Failed to delete user', err);
      throw err;
    }
  }

  async providerIds() {
    try {
      const currentUser = await this.currentUser();
      if (!currentUser) return [];
      return currentUser.providerData.map(provider => { return provider.providerId });
    } catch (err) {
      console.error('Failed to get provider Ids', err);
      throw err;
    }
  }
}