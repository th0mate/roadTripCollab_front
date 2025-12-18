export interface User {
  id: number;
  fullName: string;
  email: string;
  password?: string; // Le mot de passe est optionnel car on ne le reçoit pas toujours
  profilePicture?: string; // URL ou chemin vers la photo de profil
  // Ajoutez d'autres champs utilisateur si nécessaire
}
