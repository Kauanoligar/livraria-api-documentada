const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const repository = require('../repositories/LivrariaRepository');

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 12;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não configurado. Defina a variável de ambiente JWT_SECRET.');
}

class AuthService {
  async registrar({ nome, email, senha }) {
    if (!nome || !email || !senha) {
      throw { status: 400, message: 'Campos obrigatórios ausentes: nome, email ou senha.' };
    }

    const emailNormalizado = email.trim().toLowerCase();

    const usuarioExistente = repository.buscarUsuarioPorEmail(emailNormalizado);
    if (usuarioExistente) {
      throw { status: 409, message: 'E-mail já cadastrado no sistema.' };
    }

    if (senha.length < 6) {
      throw { status: 400, message: 'A senha deve possuir pelo menos 6 caracteres.' };
    }

    const senha_hash = await bcrypt.hash(senha, BCRYPT_ROUNDS);

    // Todo cadastro público começa como USER.
    // ADMIN não pode ser escolhido pelo cliente.
    const novoUsuario = repository.salvarUsuario({
      nome: nome.trim(),
      email: emailNormalizado,
      senha_hash,
      role: 'USER'
    });

    const { senha_hash: _, ...usuarioRetorno } = novoUsuario;
    return usuarioRetorno;
  }

  async login({ email, senha }) {
    if (!email || !senha) {
      throw { status: 400, message: 'E-mail e senha são obrigatórios.' };
    }

    const emailNormalizado = email.trim().toLowerCase();
    const usuario = repository.buscarUsuarioPorEmail(emailNormalizado);

    if (!usuario) {
      throw { status: 401, message: 'Credenciais inválidas.' };
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      throw { status: 401, message: 'Credenciais inválidas.' };
    }

    const payload = {
      sub: usuario.id,
      nome: usuario.nome,
      role: usuario.role
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'livraria-api'
    });

    return {
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        role: usuario.role
      },
      token
    };
  }
}

module.exports = new AuthService();
