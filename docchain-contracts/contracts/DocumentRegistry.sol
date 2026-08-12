// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title DocumentRegistry
 * @author DocChain
 * @notice Registra e verifica a integridade de documentos digitais via hash criptográfico.
 * @dev O hash é o SHA-256 do arquivo original (antes da criptografia),
 *      convertido para bytes32 no backend antes de chamar este contrato.
 */
contract DocumentRegistry {

    // ─────────────────────────────────────────────────────────────
    // Estruturas
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Dados armazenados para cada documento registrado.
     * @param documentHash  Hash SHA-256 do documento (bytes32)
     * @param storageRef    Referência de storage: path local ou CID IPFS
     * @param registeredBy  Endereço da wallet que fez o registro
     * @param timestamp     Timestamp Unix do bloco de registro
     * @param exists        Flag para distinguir hash não registrado de hash zerado
     */
    struct DocumentRecord {
        bytes32 documentHash;
        string  storageRef;
        address registeredBy;
        uint256 timestamp;
        bool    exists;
    }

    // ─────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────

    /// @notice Mapping do hash do documento para seu registro on-chain
    mapping(bytes32 => DocumentRecord) private _records;

    /// @notice Endereço do owner do contrato (quem fez o deploy)
    address public owner;

    /// @notice Contador total de documentos registrados
    uint256 public totalDocuments;

    // ─────────────────────────────────────────────────────────────
    // Eventos
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Emitido quando um documento é registrado com sucesso.
     * @param documentHash  Hash do documento (indexado para busca eficiente)
     * @param storageRef    Referência de onde o arquivo está armazenado
     * @param registeredBy  Quem registrou (indexado)
     * @param timestamp     Quando foi registrado
     */
    event DocumentRegistered(
        bytes32 indexed documentHash,
        string          storageRef,
        address indexed registeredBy,
        uint256         timestamp
    );

    // ─────────────────────────────────────────────────────────────
    // Erros customizados (mais eficiente que require + string)
    // ─────────────────────────────────────────────────────────────

    /// @notice Hash inválido (bytes32 zerado)
    error InvalidHash();

    /// @notice Documento já registrado — imutabilidade garantida
    error DocumentAlreadyRegistered(bytes32 documentHash);

    /// @notice Referência de storage não pode ser vazia
    error EmptyStorageRef();

    // ─────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ─────────────────────────────────────────────────────────────
    // Funções principais
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Registra um documento na blockchain.
     * @dev    Apenas uma vez por hash — tentativas de sobrescrita revertem.
     *         O hash deve ser o SHA-256 do arquivo original em bytes32.
     * @param _documentHash  Hash SHA-256 do documento como bytes32
     * @param _storageRef    Referência de storage (path local ou CID IPFS)
     */
    function registerDocument(
        bytes32 _documentHash,
        string calldata _storageRef
    ) external {
        if (_documentHash == bytes32(0)) revert InvalidHash();
        if (bytes(_storageRef).length == 0) revert EmptyStorageRef();
        if (_records[_documentHash].exists) revert DocumentAlreadyRegistered(_documentHash);

        _records[_documentHash] = DocumentRecord({
            documentHash: _documentHash,
            storageRef:   _storageRef,
            registeredBy: msg.sender,
            timestamp:    block.timestamp,
            exists:       true
        });

        totalDocuments++;

        emit DocumentRegistered(
            _documentHash,
            _storageRef,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Verifica se um documento está registrado e retorna seus dados.
     * @dev    Função view — não gasta gas, pode ser chamada por qualquer pessoa.
     * @param _documentHash  Hash SHA-256 do documento como bytes32
     * @return record        Struct DocumentRecord com todos os dados
     */
    function verifyDocument(bytes32 _documentHash)
        external
        view
        returns (DocumentRecord memory record)
    {
        return _records[_documentHash];
    }

    /**
     * @notice Verifica rapidamente se um hash está registrado (booleano).
     * @param _documentHash  Hash do documento
     * @return               true se registrado, false caso contrário
     */
    function isRegistered(bytes32 _documentHash)
        external
        view
        returns (bool)
    {
        return _records[_documentHash].exists;
    }
}
