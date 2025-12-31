import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Interface para pares de palavras relacionadas
interface WordPair {
  crewmateWord: string;
  impostorWord: string;
  category: string;
}

// Tipo para categorias de palavras
export type WordCategory = 'all' | 'agua' | 'veiculos' | 'casa' | 'animais' | 'natureza' | 'tecnologia' | 'corpo' | 'comida' | 'espaco' | 'livros' | 'musica' | 'esportes';

// Pares de palavras relacionadas (não sinônimos) organizados por categoria
// Exemplo: OCEANO/TUBARÃO - relacionados mas diferentes
const RELATED_WORD_PAIRS: WordPair[] = [
  // Água/Mar (20 pares)
  { crewmateWord: "OCEANO", impostorWord: "TUBARÃO", category: "agua" },
  { crewmateWord: "MAR", impostorWord: "PEIXE" , category: "agua" },
  { crewmateWord: "ÁGUA", impostorWord: "GELO" , category: "agua" },
  { crewmateWord: "PRAIA", impostorWord: "CONCHA" , category: "agua" },
  { crewmateWord: "ONDA", impostorWord: "SURFISTA" , category: "agua" },
  { crewmateWord: "RIO", impostorWord: "PONTE" , category: "agua" },
  { crewmateWord: "LAGO", impostorWord: "CISNE" , category: "agua" },
  { crewmateWord: "PISCINA", impostorWord: "NADADOR" , category: "agua" },
  { crewmateWord: "CHUVA", impostorWord: "GUARDA-CHUVA" , category: "agua" },
  { crewmateWord: "GOTA", impostorWord: "NUVEM" , category: "agua" },
  { crewmateWord: "CACHOEIRA", impostorWord: "PEDRA" , category: "agua" },
  { crewmateWord: "ILHA", impostorWord: "COCO" , category: "agua" },
  { crewmateWord: "PORTO", impostorWord: "BARCO" , category: "agua" },
  { crewmateWord: "FAROL", impostorWord: "NAVIO" , category: "agua" },
  { crewmateWord: "ANZOL", impostorWord: "PESCADOR" , category: "agua" },
  { crewmateWord: "REDE", impostorWord: "PESCARIA" , category: "agua" },
  { crewmateWord: "CORAL", impostorWord: "MERMAID" , category: "agua" },
  { crewmateWord: "SAL", impostorWord: "ÁGUA" , category: "agua" },
  { crewmateWord: "ESPUMA", impostorWord: "MAR" , category: "agua" },
  { crewmateWord: "MOLUSCO", impostorWord: "CONCHA" , category: "agua" },

  // Veículos/Transporte (20 pares)
  { crewmateWord: "CARRO", impostorWord: "RODA" , category: "veiculos" },
  { crewmateWord: "BICICLETA", impostorWord: "PEDAL" , category: "veiculos" },
  { crewmateWord: "AVIÃO", impostorWord: "ASA" , category: "veiculos" },
  { crewmateWord: "BARCO", impostorWord: "VELA" , category: "veiculos" },
  { crewmateWord: "MOTO", impostorWord: "CAPACETE" , category: "veiculos" },
  { crewmateWord: "ÔNIBUS", impostorWord: "PARADA" , category: "veiculos" },
  { crewmateWord: "TREM", impostorWord: "TRILHO" , category: "veiculos" },
  { crewmateWord: "METRÔ", impostorWord: "ESTAÇÃO" , category: "veiculos" },
  { crewmateWord: "TAXI", impostorWord: "TAXÍMETRO" , category: "veiculos" },
  { crewmateWord: "HELICÓPTERO", impostorWord: "HÉLICE" , category: "veiculos" },
  { crewmateWord: "NAVIO", impostorWord: "ÂNCORA" , category: "veiculos" },
  { crewmateWord: "SUBWAY", impostorWord: "TÚNEL" , category: "veiculos" },
  { crewmateWord: "PATINETE", impostorWord: "MANOBRA" , category: "veiculos" },
  { crewmateWord: "SKATE", impostorWord: "RODA" , category: "veiculos" },
  { crewmateWord: "CARRINHO", impostorWord: "BRINQUEDO" , category: "veiculos" },
  { crewmateWord: "AMBULÂNCIA", impostorWord: "SIRENE" , category: "veiculos" },
  { crewmateWord: "BOMBEIRO", impostorWord: "CARRETEL" , category: "veiculos" },
  { crewmateWord: "GUINCHO", impostorWord: "CARRO" , category: "veiculos" },
  { crewmateWord: "GARAGEM", impostorWord: "VEÍCULO" , category: "veiculos" },
  { crewmateWord: "ESTACIONAMENTO", impostorWord: "VAGA" , category: "veiculos" },

  // Casa/Construção (20 pares)
  { crewmateWord: "CASA", impostorWord: "PORTA" , category: "casa" },
  { crewmateWord: "ESCOLA", impostorWord: "QUADRO" , category: "casa" },
  { crewmateWord: "HOSPITAL", impostorWord: "MÉDICO" , category: "casa" },
  { crewmateWord: "COZINHA", impostorWord: "FOGÃO" , category: "casa" },
  { crewmateWord: "QUARTO", impostorWord: "CAMA" , category: "casa" },
  { crewmateWord: "SALA", impostorWord: "SOFÁ" , category: "casa" },
  { crewmateWord: "BANHEIRO", impostorWord: "CHUVEIRO" , category: "casa" },
  { crewmateWord: "JANELA", impostorWord: "VIDRO" , category: "casa" },
  { crewmateWord: "TELHADO", impostorWord: "TELHA" , category: "casa" },
  { crewmateWord: "PAREDE", impostorWord: "TINTA" , category: "casa" },
  { crewmateWord: "CHÃO", impostorWord: "PISO" , category: "casa" },
  { crewmateWord: "TETO", impostorWord: "LÂMPADA" , category: "casa" },
  { crewmateWord: "CORREDOR", impostorWord: "PORTA" , category: "casa" },
  { crewmateWord: "ESCADA", impostorWord: "DEGRAU" , category: "casa" },
  { crewmateWord: "ELEVADOR", impostorWord: "BOTÃO" , category: "casa" },
  { crewmateWord: "APARTAMENTO", impostorWord: "ANDAR" , category: "casa" },
  { crewmateWord: "PRÉDIO", impostorWord: "ELEVADOR" , category: "casa" },
  { crewmateWord: "CONSTRUÇÃO", impostorWord: "CIMENTO" , category: "casa" },
  { crewmateWord: "OBRA", impostorWord: "PEDREIRO" , category: "casa" },
  { crewmateWord: "FUNDAÇÃO", impostorWord: "CASA" , category: "casa" },

  // Animais (20 pares)
  { crewmateWord: "CACHORRO", impostorWord: "OSSO" , category: "animais" },
  { crewmateWord: "GATO", impostorWord: "RATO" , category: "animais" },
  { crewmateWord: "ELEFANTE", impostorWord: "TROMBA" , category: "animais" },
  { crewmateWord: "LEÃO", impostorWord: "JUBAL" , category: "animais" },
  { crewmateWord: "TIGRE", impostorWord: "LISTRA" , category: "animais" },
  { crewmateWord: "URSO", impostorWord: "MEL" , category: "animais" },
  { crewmateWord: "MACACO", impostorWord: "BANANA" , category: "animais" },
  { crewmateWord: "COELHO", impostorWord: "CENOURA" , category: "animais" },
  { crewmateWord: "CAVALO", impostorWord: "FERRO" , category: "animais" },
  { crewmateWord: "VACA", impostorWord: "LEITE" , category: "animais" },
  { crewmateWord: "PORCO", impostorWord: "CHIQUEIRO" , category: "animais" },
  { crewmateWord: "GALINHA", impostorWord: "OVO" , category: "animais" },
  { crewmateWord: "PATO", impostorWord: "LAGO" , category: "animais" },
  { crewmateWord: "PÁSSARO", impostorWord: "NINHO" , category: "animais" },
  { crewmateWord: "ÁGUIA", impostorWord: "GARRA" , category: "animais" },
  { crewmateWord: "COBRA", impostorWord: "VENENO" , category: "animais" },
  { crewmateWord: "TARTARUGA", impostorWord: "CASCO" , category: "animais" },
  { crewmateWord: "GIRAFA", impostorWord: "PESCOÇO" , category: "animais" },
  { crewmateWord: "ZEBRA", impostorWord: "LISTRA" , category: "animais" },
  { crewmateWord: "RINOCERONTE", impostorWord: "CHIFRE" , category: "animais" },

  // Natureza (20 pares)
  { crewmateWord: "ÁRVORE", impostorWord: "FOLHA" , category: "natureza" },
  { crewmateWord: "FLOR", impostorWord: "PÉTALA" , category: "natureza" },
  { crewmateWord: "MONTANHA", impostorWord: "NEVE" , category: "natureza" },
  { crewmateWord: "FLORESTA", impostorWord: "ANIMAL" , category: "natureza" },
  { crewmateWord: "CAMPO", impostorWord: "GRAMA" , category: "natureza" },
  { crewmateWord: "DESERTO", impostorWord: "CACTUS" , category: "natureza" },
  { crewmateWord: "VULCÃO", impostorWord: "LAVA" , category: "natureza" },
  { crewmateWord: "TERREMOTO", impostorWord: "TREMOR" , category: "natureza" },
  { crewmateWord: "RAIO", impostorWord: "TROVÃO" , category: "natureza" },
  { crewmateWord: "ARCO-ÍRIS", impostorWord: "CHUVA" , category: "natureza" },
  { crewmateWord: "VENTO", impostorWord: "BANDEIRA" , category: "natureza" },
  { crewmateWord: "FUMAÇA", impostorWord: "FOGO" , category: "natureza" },
  { crewmateWord: "SEMENTE", impostorWord: "PLANTA" , category: "natureza" },
  { crewmateWord: "RAIZ", impostorWord: "TERRA" , category: "natureza" },
  { crewmateWord: "TRONCO", impostorWord: "ÁRVORE" , category: "natureza" },
  { crewmateWord: "GALHO", impostorWord: "FOLHA" , category: "natureza" },
  { crewmateWord: "FRUTO", impostorWord: "SEMENTE" , category: "natureza" },
  { crewmateWord: "ESPINHO", impostorWord: "ROSA" , category: "natureza" },
  { crewmateWord: "CIPÓ", impostorWord: "ÁRVORE" , category: "natureza" },
  { crewmateWord: "MUSGO", impostorWord: "PEDRA" , category: "natureza" },

  // Tecnologia (20 pares)
  { crewmateWord: "COMPUTADOR", impostorWord: "TECLADO" , category: "tecnologia" },
  { crewmateWord: "CELULAR", impostorWord: "TELA" , category: "tecnologia" },
  { crewmateWord: "INTERNET", impostorWord: "WI-FI" , category: "tecnologia" },
  { crewmateWord: "TABLET", impostorWord: "TOQUE" , category: "tecnologia" },
  { crewmateWord: "NOTEBOOK", impostorWord: "MOUSE" , category: "tecnologia" },
  { crewmateWord: "SMARTPHONE", impostorWord: "APLICATIVO" , category: "tecnologia" },
  { crewmateWord: "CÂMERA", impostorWord: "LENTE" , category: "tecnologia" },
  { crewmateWord: "TELEVISÃO", impostorWord: "CONTROLE" , category: "tecnologia" },
  { crewmateWord: "RÁDIO", impostorWord: "ANTENA" , category: "tecnologia" },
  { crewmateWord: "FONE", impostorWord: "CABO" , category: "tecnologia" },
  { crewmateWord: "ALTO-FALANTE", impostorWord: "SOM" , category: "tecnologia" },
  { crewmateWord: "MICROFONE", impostorWord: "VOZ" , category: "tecnologia" },
  { crewmateWord: "IMPRESSORA", impostorWord: "PAPEL" , category: "tecnologia" },
  { crewmateWord: "SCANNER", impostorWord: "DOCUMENTO" , category: "tecnologia" },
  { crewmateWord: "ROTEADOR", impostorWord: "SINAL" , category: "tecnologia" },
  { crewmateWord: "BATERIA", impostorWord: "CARREGADOR" , category: "tecnologia" },
  { crewmateWord: "PENDRIVE", impostorWord: "ARQUIVO" , category: "tecnologia" },
  { crewmateWord: "WEBCAM", impostorWord: "VÍDEO" , category: "tecnologia" },
  { crewmateWord: "DRONE", impostorWord: "HÉLICE" , category: "tecnologia" },
  { crewmateWord: "ROBÔ", impostorWord: "PROGRAMA" , category: "tecnologia" },

  // Corpo Humano (20 pares)
  { crewmateWord: "CABEÇA", impostorWord: "CABELO" , category: "corpo" },
  { crewmateWord: "MÃO", impostorWord: "DEDO" , category: "corpo" },
  { crewmateWord: "OLHO", impostorWord: "PUPILA" , category: "corpo" },
  { crewmateWord: "OUVIDO", impostorWord: "ORELHA" , category: "corpo" },
  { crewmateWord: "NARIZ", impostorWord: "NARINA" , category: "corpo" },
  { crewmateWord: "BOCA", impostorWord: "DENTE" , category: "corpo" },
  { crewmateWord: "LÍNGUA", impostorWord: "PALADAR" , category: "corpo" },
  { crewmateWord: "PESCOÇO", impostorWord: "GARGANTA" , category: "corpo" },
  { crewmateWord: "PEITO", impostorWord: "CORAÇÃO" , category: "corpo" },
  { crewmateWord: "BRAÇO", impostorWord: "COTOVELO" , category: "corpo" },
  { crewmateWord: "PERNA", impostorWord: "JOELHO" , category: "corpo" },
  { crewmateWord: "PÉ", impostorWord: "DEDO" , category: "corpo" },
  { crewmateWord: "UNHA", impostorWord: "DEDO" , category: "corpo" },
  { crewmateWord: "PELE", impostorWord: "PORO" , category: "corpo" },
  { crewmateWord: "OSSO", impostorWord: "ESQUELETO" , category: "corpo" },
  { crewmateWord: "MÚSCULO", impostorWord: "FORÇA" , category: "corpo" },
  { crewmateWord: "SANGUE", impostorWord: "VEIA" , category: "corpo" },
  { crewmateWord: "CÉREBRO", impostorWord: "NEURÔNIO" , category: "corpo" },
  { crewmateWord: "PULMÃO", impostorWord: "AR" , category: "corpo" },
  { crewmateWord: "RIM", impostorWord: "FILTRO" , category: "corpo" },

  // Comida (20 pares)
  { crewmateWord: "BANANA", impostorWord: "CASCA" , category: "comida" },
  { crewmateWord: "PÃO", impostorWord: "FARINHA" , category: "comida" },
  { crewmateWord: "SORVETE", impostorWord: "CASQUINHA" , category: "comida" },
  { crewmateWord: "PIZZA", impostorWord: "FATIA" , category: "comida" },
  { crewmateWord: "HAMBÚRGUER", impostorWord: "PÃO" , category: "comida" },
  { crewmateWord: "BOLO", impostorWord: "VELA" , category: "comida" },
  { crewmateWord: "SALADA", impostorWord: "ALFACE" , category: "comida" },
  { crewmateWord: "SOPA", impostorWord: "COLHER" , category: "comida" },
  { crewmateWord: "ARROZ", impostorWord: "GRÃO" , category: "comida" },
  { crewmateWord: "FEIJÃO", impostorWord: "GRAVINHA" , category: "comida" },
  { crewmateWord: "MACARRÃO", impostorWord: "MOLHO" , category: "comida" },
  { crewmateWord: "CARNE", impostorWord: "GRELHA" , category: "comida" },
  { crewmateWord: "PEIXE", impostorWord: "ESPINHA" , category: "comida" },
  { crewmateWord: "OVO", impostorWord: "CASCA" , category: "comida" },
  { crewmateWord: "LEITE", impostorWord: "COPO" , category: "comida" },
  { crewmateWord: "CAFÉ", impostorWord: "XÍCARA" , category: "comida" },
  { crewmateWord: "AÇÚCAR", impostorWord: "DOCE" , category: "comida" },
  { crewmateWord: "SAL", impostorWord: "TEMPERO" , category: "comida" },
  { crewmateWord: "CHOCOLATE", impostorWord: "BARRA" , category: "comida" },
  { crewmateWord: "BISCOITO", impostorWord: "PACOTE" , category: "comida" },

  // Espaço (20 pares)
  { crewmateWord: "SOL", impostorWord: "LUZ" , category: "espaco" },
  { crewmateWord: "ESTRELA", impostorWord: "CONSTELAÇÃO" , category: "espaco" },
  { crewmateWord: "LUA", impostorWord: "CRATERA" , category: "espaco" },
  { crewmateWord: "PLANETA", impostorWord: "ÓRBITA" , category: "espaco" },
  { crewmateWord: "ASTEROIDE", impostorWord: "ROCHA" , category: "espaco" },
  { crewmateWord: "COMETA", impostorWord: "CAUDA" , category: "espaco" },
  { crewmateWord: "GALÁXIA", impostorWord: "ESTRELA" , category: "espaco" },
  { crewmateWord: "NEBULOSA", impostorWord: "GÁS" , category: "espaco" },
  { crewmateWord: "BURACO NEGRO", impostorWord: "GRAVIDADE" , category: "espaco" },
  { crewmateWord: "ASTRONAUTA", impostorWord: "FOGUETE" , category: "espaco" },
  { crewmateWord: "SATÉLITE", impostorWord: "ÓRBITA" , category: "espaco" },
  { crewmateWord: "TELESCÓPIO", impostorWord: "LENTE" , category: "espaco" },
  { crewmateWord: "ESTAÇÃO ESPACIAL", impostorWord: "ASTRONAUTA" , category: "espaco" },
  { crewmateWord: "MARTE", impostorWord: "ROVER" , category: "espaco" },
  { crewmateWord: "JÚPITER", impostorWord: "LUA" , category: "espaco" },
  { crewmateWord: "SATURNO", impostorWord: "ANEL" , category: "espaco" },
  { crewmateWord: "URANO", impostorWord: "GÁS" , category: "espaco" },
  { crewmateWord: "NEPTUNO", impostorWord: "AZUL" , category: "espaco" },
  { crewmateWord: "MERCÚRIO", impostorWord: "QUENTE" , category: "espaco" },
  { crewmateWord: "VÊNUS", impostorWord: "NUVEM" , category: "espaco" },

  // Livros/Educação (20 pares)
  { crewmateWord: "LIVRO", impostorWord: "PÁGINA" , category: "livros" },
  { crewmateWord: "CANETA", impostorWord: "TINTA" , category: "livros" },
  { crewmateWord: "CADERNO", impostorWord: "LINHA" , category: "livros" },
  { crewmateWord: "LÁPIS", impostorWord: "GRAFITE" , category: "livros" },
  { crewmateWord: "BORRACHA", impostorWord: "LÁPIS" , category: "livros" },
  { crewmateWord: "RÉGUA", impostorWord: "MEDIDA" , category: "livros" },
  { crewmateWord: "ESTOJO", impostorWord: "MATERIAL" , category: "livros" },
  { crewmateWord: "MOCHILA", impostorWord: "CADERNO" , category: "livros" },
  { crewmateWord: "PROFESSOR", impostorWord: "QUADRO" , category: "livros" },
  { crewmateWord: "ALUNO", impostorWord: "CADEIRA" , category: "livros" },
  { crewmateWord: "AULA", impostorWord: "SALA" , category: "livros" },
  { crewmateWord: "PROVA", impostorWord: "PERGUNTA" , category: "livros" },
  { crewmateWord: "DICIONÁRIO", impostorWord: "PALAVRA" , category: "livros" },
  { crewmateWord: "ENCICLOPÉDIA", impostorWord: "INFORMAÇÃO" , category: "livros" },
  { crewmateWord: "BIBLIOTECA", impostorWord: "LIVRO" , category: "livros" },
  { crewmateWord: "REVISTA", impostorWord: "ARTIGO" , category: "livros" },
  { crewmateWord: "JORNAL", impostorWord: "NOTÍCIA" , category: "livros" },
  { crewmateWord: "FOLHA", impostorWord: "PAPEL" , category: "livros" },
  { crewmateWord: "CARTOLINA", impostorWord: "COR" , category: "livros" },
  { crewmateWord: "GIZ", impostorWord: "QUADRO" , category: "livros" },

  // Música (20 pares)
  { crewmateWord: "MÚSICA", impostorWord: "NOTA" , category: "musica" },
  { crewmateWord: "VIOLÃO", impostorWord: "CORDA" , category: "musica" },
  { crewmateWord: "BATERIA", impostorWord: "BAQUETA" , category: "musica" },
  { crewmateWord: "PIANO", impostorWord: "TECLA" , category: "musica" },
  { crewmateWord: "GUITARRA", impostorWord: "PALHETA" , category: "musica" },
  { crewmateWord: "FLAUTA", impostorWord: "BUraco" , category: "musica" },
  { crewmateWord: "SAXOFONE", impostorWord: "BOCAL" , category: "musica" },
  { crewmateWord: "TROMPETE", impostorWord: "BOCAL" , category: "musica" },
  { crewmateWord: "VIOLINO", impostorWord: "ARCO" , category: "musica" },
  { crewmateWord: "TAMBOR", impostorWord: "BAQUETA" , category: "musica" },
  { crewmateWord: "MICROFONE", impostorWord: "CANTOR" , category: "musica" },
  { crewmateWord: "ALTO-FALANTE", impostorWord: "SOM" , category: "musica" },
  { crewmateWord: "FONE DE OUVIDO", impostorWord: "MÚSICA" , category: "musica" },
  { crewmateWord: "RÁDIO", impostorWord: "ESTAÇÃO" , category: "musica" },
  { crewmateWord: "CD", impostorWord: "MÚSICA" , category: "musica" },
  { crewmateWord: "VINIL", impostorWord: "AGULHA" , category: "musica" },
  { crewmateWord: "PLAYLIST", impostorWord: "MÚSICA" , category: "musica" },
  { crewmateWord: "CANÇÃO", impostorWord: "LETRA" , category: "musica" },
  { crewmateWord: "CORO", impostorWord: "VOZ" , category: "musica" },
  { crewmateWord: "ORQUESTRA", impostorWord: "MAESTRO" , category: "musica" },

  // Esportes (20 pares)
  { crewmateWord: "FUTEBOL", impostorWord: "BOLA" , category: "esportes" },
  { crewmateWord: "NATAÇÃO", impostorWord: "PISCINA" , category: "esportes" },
  { crewmateWord: "CORRIDA", impostorWord: "TÊNIS" , category: "esportes" },
  { crewmateWord: "BASQUETE", impostorWord: "CESTA" , category: "esportes" },
  { crewmateWord: "VOLEI", impostorWord: "REDE" , category: "esportes" },
  { crewmateWord: "TÊNIS", impostorWord: "RAQUETE" , category: "esportes" },
  { crewmateWord: "GOLFE", impostorWord: "TACO" , category: "esportes" },
  { crewmateWord: "CICLISMO", impostorWord: "BICICLETA" , category: "esportes" },
  { crewmateWord: "BOX", impostorWord: "LUVA" , category: "esportes" },
  { crewmateWord: "LUTA", impostorWord: "RINGUE" , category: "esportes" },
  { crewmateWord: "SURFE", impostorWord: "PRANCHA" , category: "esportes" },
  { crewmateWord: "SKATE", impostorWord: "MANOBRA" , category: "esportes" },
  { crewmateWord: "ESQUI", impostorWord: "NEVE" , category: "esportes" },
  { crewmateWord: "PATINS", impostorWord: "RODA" , category: "esportes" },
  { crewmateWord: "ARCO E FLECHA", impostorWord: "ALVO" , category: "esportes" },
  { crewmateWord: "TIRO", impostorWord: "ALVO" , category: "esportes" },
  { crewmateWord: "ATLETISMO", impostorWord: "PISTA" , category: "esportes" },
  { crewmateWord: "GINÁSTICA", impostorWord: "APARELHO" , category: "esportes" },
  { crewmateWord: "DANÇA", impostorWord: "PASSO" , category: "esportes" },
  { crewmateWord: "IÔ-IÔ", impostorWord: "CORDÃO" , category: "esportes" },
];

// Função para obter um par aleatório de palavras relacionadas
// Se category for 'all', escolhe de todas as categorias
// Caso contrário, filtra apenas pela categoria especificada
const getWordPair = (category: WordCategory = 'all'): WordPair => {
  let filteredPairs = RELATED_WORD_PAIRS;
  
  if (category !== 'all') {
    filteredPairs = RELATED_WORD_PAIRS.filter(pair => pair.category === category);
  }
  
  if (filteredPairs.length === 0) {
    // Fallback para todas as palavras se a categoria não tiver pares
    filteredPairs = RELATED_WORD_PAIRS;
  }
  
  const randomIndex = Math.floor(Math.random() * filteredPairs.length);
  return filteredPairs[randomIndex];
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const useGame = () => {
  const startGame = useCallback(
    async (roomId: string, hostPlayerId: string, numImpostors: number) => {
      try {
        // Get room
        const { data: roomData, error: roomError } = await supabase
          .from("rooms")
          .select("*")
          .eq("id", roomId)
          .single();

        if (roomError) throw roomError;
        if (!roomData) throw new Error("Room not found");

        // Verify host
        if (roomData.host_player_id !== hostPlayerId) {
          throw new Error("Only host can start the game");
        }

        // Get all players
        const { data: playersData, error: playersError } = await supabase
          .from("players")
          .select("*")
          .eq("room_id", roomId);

        if (playersError) throw playersError;
        if (!playersData || playersData.length < 3) {
          throw new Error("Not enough players. Need at least 3 players");
        }

        // Validate number of impostors
        if (numImpostors < 1) {
          throw new Error("Number of impostors must be at least 1");
        }
        if (numImpostors >= playersData.length) {
          throw new Error(
            "Number of impostors must be less than number of players"
          );
        }

        // Generate words - escolhe um par de palavras relacionadas baseado na categoria
        const category = (roomData.word_category as WordCategory) || 'all';
        const wordPair = getWordPair(category);
        const crewmateWord = wordPair.crewmateWord;
        const impostorWord = wordPair.impostorWord;

        // Shuffle players and select impostors
        // Use a more reliable method to ensure exactly numImpostors are selected
        const shuffledPlayers = shuffleArray(playersData);
        const impostorIndices = new Set<number>();
        
        // Create array of indices and shuffle to select impostors
        const indices = Array.from({ length: shuffledPlayers.length }, (_, i) => i);
        const shuffledIndices = shuffleArray(indices);
        
        // Select first numImpostors indices as impostors
        for (let i = 0; i < numImpostors && i < shuffledIndices.length; i++) {
          impostorIndices.add(shuffledIndices[i]);
        }
        
        // Verify we have the correct number of impostors
        if (impostorIndices.size !== numImpostors) {
          console.error(
            `Impostor count mismatch: expected ${numImpostors}, got ${impostorIndices.size}`
          );
        }

        const newRoundNumber = roomData.round_number + 1;

        // Randomly select a starting player
        const randomIndex = Math.floor(Math.random() * shuffledPlayers.length);
        const startingPlayer = shuffledPlayers[randomIndex];

        // Clear ALL old words for this room to ensure clean state
        await supabase
          .from("player_words")
          .delete()
          .eq("room_id", roomId);

        // Assign words to ALL current players in the room FIRST
        // This ensures words exist before room update triggers polling
        const playerWords = shuffledPlayers.map((player, index) => ({
          room_id: roomId,
          round_number: newRoundNumber,
          player_id: player.id,
          word: impostorIndices.has(index) ? impostorWord : crewmateWord,
          is_impostor: impostorIndices.has(index),
        }));

        // Verify no duplicates before inserting
        const playerIds = new Set(playerWords.map(pw => pw.player_id));
        if (playerIds.size !== playerWords.length) {
          throw new Error("Duplicate players detected in word assignment");
        }

        // Double-check: verify no words exist for this round before inserting
        const { data: existingWords } = await supabase
          .from("player_words")
          .select("player_id")
          .eq("room_id", roomId)
          .eq("round_number", newRoundNumber);

        if (existingWords && existingWords.length > 0) {
          console.warn(
            `Found ${existingWords.length} existing words for round ${newRoundNumber}, deleting them`
          );
          await supabase
            .from("player_words")
            .delete()
            .eq("room_id", roomId)
            .eq("round_number", newRoundNumber);
        }

        const { error: wordsError } = await supabase
          .from("player_words")
          .insert(playerWords);

        if (wordsError) {
          console.error("Error inserting player words:", wordsError);
          throw wordsError;
        }

        // Update room AFTER words are inserted
        // This ensures polling finds words immediately when it starts
        const { error: updateError } = await supabase
          .from("rooms")
          .update({
            status: "in_progress",
            round_number: newRoundNumber,
            word: crewmateWord,
            impostor_word: impostorWord,
            num_impostors: numImpostors,
            starting_player_id: startingPlayer.id,
          })
          .eq("id", roomId);

        if (updateError) throw updateError;

        // Verify all words were inserted correctly
        const { data: insertedWords } = await supabase
          .from("player_words")
          .select("player_id, round_number, is_impostor")
          .eq("room_id", roomId)
          .eq("round_number", newRoundNumber);

        if (insertedWords) {
          const actualImpostorCount = insertedWords.filter(
            (w) => w.is_impostor
          ).length;
          
          if (insertedWords.length !== shuffledPlayers.length) {
            console.warn(
              `Word count mismatch: expected ${shuffledPlayers.length}, got ${insertedWords.length}`
            );
          }
          
          if (actualImpostorCount !== numImpostors) {
            console.warn(
              `Impostor count mismatch in DB: expected ${numImpostors}, got ${actualImpostorCount}`
            );
          }
        }

        toast.success("Partida iniciada!");
        return { success: true, roundNumber: newRoundNumber };
      } catch (error: any) {
        console.error("Error starting game:", error);
        toast.error(error.message || "Erro ao iniciar partida");
        throw error;
      }
    },
    []
  );

  const resetGame = useCallback(
    async (roomId: string, hostPlayerId: string) => {
      try {
        // Get room
        const { data: roomData, error: roomError } = await supabase
          .from("rooms")
          .select("*")
          .eq("id", roomId)
          .single();

        if (roomError) throw roomError;
        if (!roomData) throw new Error("Room not found");

        // Verify host
        if (roomData.host_player_id !== hostPlayerId) {
          throw new Error("Only host can reset the game");
        }

        // Get all players
        const { data: playersData, error: playersError } = await supabase
          .from("players")
          .select("*")
          .eq("room_id", roomId);

        if (playersError) throw playersError;
        if (!playersData || playersData.length < 3) {
          throw new Error("Not enough players. Need at least 3 players");
        }

        // Use the number of impostors from the room (default to 1 if not set)
        let numImpostors = roomData.num_impostors || 1;
        if (numImpostors < 1) numImpostors = 1;
        if (numImpostors >= playersData.length) {
          numImpostors = playersData.length - 1;
        }

        // Generate new words - escolhe um par de palavras relacionadas baseado na categoria
        const category = (roomData.word_category as WordCategory) || 'all';
        const wordPair = getWordPair(category);
        const crewmateWord = wordPair.crewmateWord;
        const impostorWord = wordPair.impostorWord;

        // Shuffle players and select impostors
        // Use a more reliable method to ensure exactly numImpostors are selected
        const shuffledPlayers = shuffleArray(playersData);
        const impostorIndices = new Set<number>();
        
        // Create array of indices and shuffle to select impostors
        const indices = Array.from({ length: shuffledPlayers.length }, (_, i) => i);
        const shuffledIndices = shuffleArray(indices);
        
        // Select first numImpostors indices as impostors
        for (let i = 0; i < numImpostors && i < shuffledIndices.length; i++) {
          impostorIndices.add(shuffledIndices[i]);
        }
        
        // Verify we have the correct number of impostors
        if (impostorIndices.size !== numImpostors) {
          console.error(
            `Impostor count mismatch: expected ${numImpostors}, got ${impostorIndices.size}`
          );
        }

        const newRoundNumber = roomData.round_number + 1;

        // Randomly select a starting player
        const randomIndex = Math.floor(Math.random() * shuffledPlayers.length);
        const startingPlayer = shuffledPlayers[randomIndex];

        // Step 1: Clear ALL old words for this room FIRST (including from previous rounds)
        // This ensures no duplicate words exist
        const { error: deleteError } = await supabase
          .from("player_words")
          .delete()
          .eq("room_id", roomId);

        if (deleteError) {
          console.error("Error deleting old words:", deleteError);
          throw deleteError;
        }

        // Step 2: Assign new words to ALL current players in the room FIRST
        // This ensures words exist before room update triggers polling
        const playerWords = shuffledPlayers.map((player, index) => ({
          room_id: roomId,
          round_number: newRoundNumber,
          player_id: player.id,
          word: impostorIndices.has(index) ? impostorWord : crewmateWord,
          is_impostor: impostorIndices.has(index),
        }));

        // Verify no duplicates before inserting
        const playerIds = new Set(playerWords.map(pw => pw.player_id));
        if (playerIds.size !== playerWords.length) {
          throw new Error("Duplicate players detected in word assignment");
        }

        // Double-check: verify no words exist for this round before inserting
        const { data: existingWords } = await supabase
          .from("player_words")
          .select("player_id")
          .eq("room_id", roomId)
          .eq("round_number", newRoundNumber);

        if (existingWords && existingWords.length > 0) {
          console.warn(
            `Found ${existingWords.length} existing words for round ${newRoundNumber}, deleting them`
          );
          await supabase
            .from("player_words")
            .delete()
            .eq("room_id", roomId)
            .eq("round_number", newRoundNumber);
        }

        const { error: wordsError } = await supabase
          .from("player_words")
          .insert(playerWords);

        if (wordsError) {
          console.error("Error inserting player words:", wordsError);
          throw wordsError;
        }

        // Step 3: Update room with new round number, words, and starting player
        // This happens AFTER words are inserted so polling finds words immediately
        const { error: updateError } = await supabase
          .from("rooms")
          .update({
            round_number: newRoundNumber,
            word: crewmateWord,
            impostor_word: impostorWord,
            starting_player_id: startingPlayer.id,
          })
          .eq("id", roomId);

        if (updateError) throw updateError;

        // Step 4: Verify all words were inserted correctly
        const { data: insertedWords, error: verifyError } = await supabase
          .from("player_words")
          .select("player_id, round_number, is_impostor")
          .eq("room_id", roomId)
          .eq("round_number", newRoundNumber);

        if (verifyError) {
          console.error("Error verifying inserted words:", verifyError);
        } else {
          const actualImpostorCount = insertedWords?.filter(
            (w) => w.is_impostor
          ).length || 0;
          
          if (insertedWords && insertedWords.length !== shuffledPlayers.length) {
            console.warn(
              `Word count mismatch: expected ${shuffledPlayers.length}, got ${insertedWords.length}`
            );
          }
          
          if (actualImpostorCount !== numImpostors) {
            console.warn(
              `Impostor count mismatch in DB: expected ${numImpostors}, got ${actualImpostorCount}`
            );
          }
        }

        toast.success("Nova rodada iniciada!");
        return { success: true, roundNumber: newRoundNumber };
      } catch (error: any) {
        console.error("Error restarting:", error);
        toast.error(error.message || "Erro ao reiniciar");
        throw error;
      }
    },
    []
  );

  return {
    startGame,
    resetGame,
  };
};

