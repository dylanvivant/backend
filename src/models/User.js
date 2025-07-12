const BaseModel = require('./BaseModel');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class User extends BaseModel {
  constructor() {
    super('users');
  }

  // Créer un utilisateur avec hash du mot de passe
  async createUser(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const verificationToken = uuidv4();

    const newUser = {
      ...userData,
      password_hash: hashedPassword,
      verification_token: verificationToken,
      is_verified: false,
      must_change_password: userData.must_change_password === true,
    };

    delete newUser.password;
    return await this.create(newUser);
  }

  // Changer le mot de passe et désactiver le flag must_change_password
  async updatePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        password_hash: hashedPassword,
        must_change_password: false,
      })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Trouver par email
  async findByEmail(email) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
                *,
                roles(name),
                player_types(name)
            `
      )
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Vérifier mot de passe
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Obtenir tous les membres de l'équipe avec leurs rôles
  async getTeamMembers() {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
                id, pseudo, email, discord_username, rank, is_verified,
                roles(id, name),
                player_types(id, name)
            `
      )
      .order('pseudo');

    if (error) throw error;
    return data;
  }

  // Obtenir les capitaines
  async getCaptains() {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
                id, pseudo, email, discord_username,
                roles(name)
            `
      )
      .eq('roles.name', 'Capitaine');

    if (error) throw error;
    return data;
  }

  // Vérifier le token de vérification
  async verifyEmail(token) {
    console.log('🔍 User.verifyEmail appelé avec token:', token);

    // D'abord vérifier si le token existe
    const { data: existingUser, error: findError } = await this.supabase
      .from(this.tableName)
      .select('id, email, pseudo, is_verified, verification_token')
      .eq('verification_token', token)
      .single();

    console.log('🔍 Résultat de la recherche:', { existingUser, findError });

    if (findError && findError.code === 'PGRST116') {
      // Token non trouvé
      console.log('❌ Token non trouvé (PGRST116)');
      return null;
    }

    if (findError) {
      console.log('❌ Erreur lors de la recherche:', findError);
      throw findError;
    }

    if (!existingUser) {
      console.log('❌ Aucun utilisateur retourné');
      return null;
    }

    console.log(
      '✅ Utilisateur trouvé:',
      existingUser.email,
      'is_verified:',
      existingUser.is_verified
    );

    // Si l'utilisateur est déjà vérifié
    if (existingUser.is_verified) {
      console.log('ℹ️ Utilisateur déjà vérifié');
      return existingUser;
    }

    // Mettre à jour le statut de vérification
    console.log('🔄 Mise à jour du statut de vérification...');
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        is_verified: true,
        verification_token: null,
      })
      .eq('id', existingUser.id)
      .select()
      .single();

    if (error) {
      console.log('❌ Erreur lors de la mise à jour:', error);
      throw error;
    }

    console.log('✅ Statut de vérification mis à jour');
    return data;
  }

  // Obtenir les membres actifs de l'équipe (pour invitation automatique)
  async getActiveTeamMembers() {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        id,
        pseudo,
        email,
        roles(id, name),
        player_types(name)
      `
      )
      .eq('is_verified', true)
      .eq('role_id', 1) // Ne récupérer que les joueurs pour les entrainements
      .not('roles', 'is', null); // Exclure les utilisateurs sans rôle

    if (error) throw error;
    return data || [];
  }

  // Obtenir les emails des utilisateurs par leurs IDs
  async getEmailsByIds(userIds) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('id, email, pseudo')
      .in('id', userIds);

    if (error) throw error;
    return data || [];
  }

  // DEBUG: Lister tous les tokens de vérification actifs
  async getAllVerificationTokens() {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('id, email, pseudo, verification_token, is_verified')
      .not('verification_token', 'is', null);

    if (error) throw error;
    return data || [];
  }
}

module.exports = User;
