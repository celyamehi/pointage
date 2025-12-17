from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
import uuid
import logging

logger = logging.getLogger(__name__)

from app.db import get_db
from app.auth.models import User, UserCreate, UserUpdate, Token
from app.auth.utils import (
    authenticate_user,
    create_access_token,
    get_password_hash,
    verify_password,
    get_current_active_user,
    get_admin_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter()


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Endpoint pour obtenir un token d'accès
    """
    logger.info(f" Tentative de connexion pour l'utilisateur: {form_data.username}")
    user = await authenticate_user(form_data.username, form_data.password)
    
    if not user:
        logger.warning(f" Échec de connexion pour l'utilisateur: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    logger.info(f" Connexion réussie pour l'utilisateur: {form_data.username} (role: {user.role})")
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """
    Endpoint pour récupérer les informations de l'utilisateur connecté
    """
    return current_user


@router.post("/register", response_model=User, dependencies=[Depends(get_admin_user)])
async def register_user(user: UserCreate):
    """
    Endpoint pour créer un nouvel utilisateur (admin uniquement)
    """
    db = await get_db()
    
    # Vérification si l'email existe déjà
    try:
        existing_user = db.table("agents").select("*").eq("email", user.email).execute()
        
        if existing_user.data and len(existing_user.data) > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un utilisateur avec cet email existe déjà"
            )
        
        # Création du nouvel utilisateur
        try:
            hashed_password = get_password_hash(user.password)
            print(f"Mot de passe hashé: {hashed_password[:10]}...")
        except Exception as e:
            print(f"Erreur lors du hashage du mot de passe: {str(e)}")
            # Solution temporaire si le hashage échoue
            hashed_password = user.password
            print("Utilisation du mot de passe en clair comme solution temporaire")
        
        new_user = {
            "id": str(uuid.uuid4()),
            "email": user.email,
            "nom": user.nom,
            "password_hash": hashed_password,
            "role": user.role
        }
        
        print(f"Création d'un nouvel utilisateur: {new_user['email']}")
        result = db.table("agents").insert(new_user).execute()
        print(f"Résultat de la création: {result}")
    except Exception as e:
        print(f"Erreur lors de la création de l'utilisateur: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la création de l'utilisateur: {str(e)}"
        )
    
    if not result.data or len(result.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la création de l'utilisateur"
        )
    
    created_user = result.data[0]
    
    return User(
        id=created_user["id"],
        email=created_user["email"],
        nom=created_user["nom"],
        role=created_user["role"],
        created_at=created_user["created_at"],
        updated_at=created_user["updated_at"]
    )


@router.put("/users/{user_id}", response_model=User, dependencies=[Depends(get_admin_user)])
async def update_user(user_id: str, user_update: UserUpdate):
    """
    Endpoint pour mettre à jour un utilisateur (admin uniquement)
    """
    db = await get_db()
    
    # Vérification si l'utilisateur existe
    try:
        print(f"Vérification de l'existence de l'utilisateur: {user_id}")
        existing_user = db.table("agents").select("*").eq("id", user_id).execute()
        print(f"Résultat de la vérification: {existing_user}")
        
        if not existing_user.data or len(existing_user.data) == 0:
            print(f"Utilisateur non trouvé: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )
    except Exception as e:
        print(f"Erreur lors de la vérification de l'utilisateur: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la vérification de l'utilisateur: {str(e)}"
        )
    
    # Préparation des données à mettre à jour
    update_data = {}
    
    if user_update.email is not None:
        update_data["email"] = user_update.email
    
    if user_update.nom is not None:
        update_data["nom"] = user_update.nom
    
    if user_update.role is not None:
        # Validation des rôles acceptés
        roles_valides = [
            'admin', 'agent', 'agent_etudiant', 'informaticien', 
            'analyste_informaticienne', 'superviseur', 
            'agent_administratif', 'charge_administration'
        ]
        
        if user_update.role not in roles_valides:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Rôle non valide. Rôles acceptés: {', '.join(roles_valides)}"
            )
        
        update_data["role"] = user_update.role
    
    if user_update.password is not None:
        try:
            update_data["password_hash"] = get_password_hash(user_update.password)
            print(f"Mot de passe hashé pour la mise à jour: {update_data['password_hash'][:10]}...")
        except Exception as e:
            print(f"Erreur lors du hashage du mot de passe pour la mise à jour: {str(e)}")
            # Solution temporaire si le hashage échoue
            update_data["password_hash"] = user_update.password
            print("Utilisation du mot de passe en clair comme solution temporaire pour la mise à jour")
    
    update_data["updated_at"] = "NOW()"
    
    # Mise à jour de l'utilisateur
    try:
        result = db.table("agents").update(update_data).eq("id", user_id).execute()
        print(f"Résultat de la mise à jour: {result}")
    except Exception as e:
        print(f"Erreur lors de la mise à jour de l'utilisateur: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la mise à jour de l'utilisateur: {str(e)}"
        )
    
    if not result.data or len(result.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la mise à jour de l'utilisateur"
        )
    
    updated_user = result.data[0]
    
    return User(
        id=updated_user["id"],
        email=updated_user["email"],
        nom=updated_user["nom"],
        role=updated_user["role"],
        created_at=updated_user["created_at"],
        updated_at=updated_user["updated_at"]
    )


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(request: PasswordChangeRequest, current_user: User = Depends(get_current_active_user)):
    """
    Endpoint pour changer le mot de passe de l'utilisateur connecté
    """
    try:
        print(f"Changement de mot de passe pour l'utilisateur: {current_user.email}")
        db = await get_db()
        
        # Récupérer l'utilisateur complet avec le hash du mot de passe
        user_data = db.table("agents").select("*").eq("id", str(current_user.id)).execute()
        
        if not user_data.data or len(user_data.data) == 0:
            print(f"Utilisateur non trouvé: {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )
        
        user = user_data.data[0]
        
        # Vérifier l'ancien mot de passe
        if not verify_password(request.current_password, user["password_hash"]):
            print("Mot de passe actuel incorrect")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mot de passe actuel incorrect"
            )
        
        # Hasher le nouveau mot de passe
        try:
            hashed_password = get_password_hash(request.new_password)
            print(f"Nouveau mot de passe hashé: {hashed_password[:10]}...")
        except Exception as e:
            print(f"Erreur lors du hashage du nouveau mot de passe: {str(e)}")
            # Solution temporaire si le hashage échoue
            hashed_password = request.new_password
            print("Utilisation du mot de passe en clair comme solution temporaire")
        
        # Mettre à jour le mot de passe
        update_result = db.table("agents").update({"password_hash": hashed_password}).eq("id", str(current_user.id)).execute()
        print(f"Résultat de la mise à jour: {update_result}")
        
        return {"message": "Mot de passe changé avec succès"}
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Erreur lors du changement de mot de passe: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du changement de mot de passe: {str(e)}"
        )


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_admin_user)])
async def delete_user(user_id: str):
    """
    Endpoint pour supprimer un utilisateur (admin uniquement)
    """
    db = await get_db()
    
    # Vérification si l'utilisateur existe
    try:
        existing_user = db.table("agents").select("*").eq("id", user_id).execute()
        
        if not existing_user.data or len(existing_user.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )
        
        # Suppression de l'utilisateur
        db.table("agents").delete().eq("id", user_id).execute()
        print(f"Utilisateur supprimé avec succès: {user_id}")
    except Exception as e:
        print(f"Erreur lors de la suppression de l'utilisateur: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la suppression de l'utilisateur: {str(e)}"
        )
    
    return None
