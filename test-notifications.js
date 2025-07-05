// Test des nouvelles routes de notifications
const testNotifications = async () => {
  const baseURL = 'http://localhost:3000/api';

  try {
    // 1. Test de connexion
    console.log('🔐 Test de connexion...');
    const loginResponse = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'joueur@test.com',
        password: 'TestPass123',
      }),
    });

    const loginData = await loginResponse.json();
    console.log('Connexion:', loginData.success ? '✅ Réussie' : '❌ Échec');

    if (!loginData.success) {
      console.error('Impossible de se connecter:', loginData.message);
      return;
    }

    // Extraire le token
    const token =
      loginData.data?.tokens?.access_token ||
      loginData.data?.tokens?.accessToken;
    if (!token) {
      console.error('❌ Token manquant dans la réponse');
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // 2. Test récupération des notifications
    console.log('📬 Test récupération des notifications...');
    const notificationsResponse = await fetch(`${baseURL}/notifications`, {
      headers,
    });

    const notificationsData = await notificationsResponse.json();
    console.log(
      'Notifications:',
      notificationsData.success ? '✅ Récupérées' : '❌ Erreur'
    );

    if (notificationsData.success) {
      console.log(
        'Nombre de notifications:',
        notificationsData.data?.notifications?.length || 0
      );
      console.log(
        'Notifications non lues:',
        notificationsData.data?.unread_count || 0
      );

      // Afficher les premières notifications
      if (notificationsData.data?.notifications?.length > 0) {
        console.log('Première notification:', {
          id: notificationsData.data.notifications[0].id,
          title: notificationsData.data.notifications[0].title,
          type: notificationsData.data.notifications[0].type,
          is_read: notificationsData.data.notifications[0].is_read,
        });
      }
    } else {
      console.error('Erreur notifications:', notificationsData.message);
    }

    // 3. Test compteur de notifications
    console.log('🔢 Test compteur de notifications...');
    const countResponse = await fetch(`${baseURL}/notifications/count`, {
      headers,
    });

    const countData = await countResponse.json();
    console.log('Compteur:', countData.success ? '✅ Récupéré' : '❌ Erreur');

    if (countData.success) {
      console.log('Nombre non lues:', countData.data?.count || 0);
    }

    // 4. Test préférences
    console.log('⚙️ Test préférences...');
    const preferencesResponse = await fetch(
      `${baseURL}/notifications/preferences`,
      {
        headers,
      }
    );

    const preferencesData = await preferencesResponse.json();
    console.log(
      'Préférences:',
      preferencesData.success ? '✅ Récupérées' : '❌ Erreur'
    );

    if (preferencesData.success) {
      console.log('Préférences:', preferencesData.data);
    }

    // 5. Test statistiques
    console.log('📊 Test statistiques...');
    const statsResponse = await fetch(`${baseURL}/notifications/stats`, {
      headers,
    });

    const statsData = await statsResponse.json();
    console.log(
      'Statistiques:',
      statsData.success ? '✅ Récupérées' : '❌ Erreur'
    );

    if (statsData.success) {
      console.log('Stats:', statsData.data);
    }
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
};

// Exécuter le test
testNotifications();
