import { Pinecone } from '@pinecone-database/pinecone';

export const getPineconeClient = () => {
    return new Pinecone({
        apiKey: process.env.PINECONE_API_KEY! // Ensure to set this in your environment variables
    });
};
