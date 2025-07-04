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
    };

    delete newUser.password;
    return await this.create(newUser);
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
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        is_verified: true,
        verification_token: null,
      })
      .eq('verification_token', token)
      .select()
      .single();

    if (error) throw error;
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
        roles(name),
        player_types(name)
      `
      )
      .eq('is_verified', true)
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
}

module.exports = User;
