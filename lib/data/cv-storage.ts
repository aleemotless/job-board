import { DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, NoSuchKey, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { CV_KEY_PREFIX } from "@/lib/config";

// CV file bytes in S3, one object per application, keyed by application id. Metadata (name, type,
// size) stays on the application document. Credentials and region come from the SDK's default
// chain: the EC2 instance role and AWS_REGION when deployed, your AWS profile locally.

declare global {
    var __cvS3: S3Client | undefined;
}

// Kept on globalThis so dev-server hot reloads reuse one client.
const s3 = (globalThis.__cvS3 ??= new S3Client({}));

function bucket(): string {
    const name = process.env.CV_BUCKET;
    if (!name) throw new Error("CV_BUCKET is not set");
    return name;
}

const keyFor = (applicationId: string) => `${CV_KEY_PREFIX}${applicationId}`;

export async function putCv(applicationId: string, data: Uint8Array, contentType: string): Promise<void> {
    await s3.send(new PutObjectCommand({ Bucket: bucket(), Key: keyFor(applicationId), Body: data, ContentType: contentType }));
}

export async function getCv(applicationId: string): Promise<Uint8Array<ArrayBuffer> | undefined> {
    try {
        const object = await s3.send(new GetObjectCommand({ Bucket: bucket(), Key: keyFor(applicationId) }));
        // Copied into a plain ArrayBuffer-backed array, the type StoredCv expects.
        return object.Body ? new Uint8Array(await object.Body.transformToByteArray()) : undefined;
    } catch (error) {
        if (error instanceof NoSuchKey) return undefined;
        throw error;
    }
}

// Deleting a missing key succeeds, so these are safe to repeat.
export async function deleteCv(applicationId: string): Promise<void> {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket(), Key: keyFor(applicationId) }));
}

export async function deleteCvs(applicationIds: string[]): Promise<void> {
    // One request deletes up to 1000 keys.
    for (let i = 0; i < applicationIds.length; i += 1000) {
        const keys = applicationIds.slice(i, i + 1000).map((id) => ({ Key: keyFor(id) }));
        await s3.send(new DeleteObjectsCommand({ Bucket: bucket(), Delete: { Objects: keys, Quiet: true } }));
    }
}
