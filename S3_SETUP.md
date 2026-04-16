# AWS S3 Setup Guide for Finflow

## Overview
This guide will walk you through connecting your AWS S3 bucket to Finflow for secure PDF and document storage.

## Step 1: AWS S3 Bucket Configuration

### 1.1 Create S3 Bucket
1. Go to AWS Console → S3 → Create bucket
2. **Bucket name**: Choose a unique name (e.g., `finflow-documents-yourname`)
3. **Region**: Select closest to your users (e.g., `us-east-1`)
4. **Block Public Access settings**:
   - Check "Block all public access" (files will be accessed via pre-signed URLs)
5. Click **Create bucket**

### 1.2 Configure CORS (for browser uploads)
Go to your bucket → Permissions → CORS configuration:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE",
            "HEAD"
        ],
        "AllowedOrigins": [
            "http://localhost:3000",
            "https://your-production-domain.com"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

### 1.3 Create IAM User for API Access
1. Go to IAM → Users → Create user
2. **User name**: `finflow-s3-access`
3. Attach policies directly → Create policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME"
        }
    ]
}
```

4. Create access keys → Save **Access Key ID** and **Secret Access Key**

## Step 2: Environment Variables

Create `.env.local` in your project root:

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=finflow-documents-yourname

# Optional: For MinIO or other S3-compatible services
# S3_ENDPOINT=https://s3.wasabisys.com
# S3_FORCE_PATH_STYLE=false
```

**Important**: Add `.env.local` to `.gitignore` to keep credentials secure.

## Step 3: Install AWS SDK

```bash
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

Or if using npm:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## Step 4: Storage Changes

### Storage Limit Changed
The storage limit has been updated from **500MB to 100MB** in `lib/data-store.tsx`:

```typescript
total: 104857600, // 100MB instead of 500MB
```

## Step 5: Usage in Components

### Using the Upload Hook

```typescript
import { useS3Upload, formatFileSize } from "@/lib/upload"

function DocumentUploader() {
  const { uploadFile, deleteFile, status, progress, error, url, reset } = useS3Upload()
  const { addDocument } = useDataStore()

  const handleFileSelect = async (file: File) => {
    // Upload to S3
    const result = await uploadFile(file, "user-123", "receipt")

    if (result.success && result.url) {
      // Add to local state with S3 URL
      addDocument({
        name: file.name,
        type: "receipt",
        size: result.size || file.size,
        url: result.url, // S3 URL stored here
      })
    }
  }

  return (
    <div>
      <input
        type="file"
        accept=".pdf,.jpg,.png"
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
      />
      {status === "uploading" && <progress value={progress} max={100} />}
      {status === "error" && <p className="text-red-500">{error}</p>}
    </div>
  )
}
```

## Step 6: Testing

1. Start development server:
   ```bash
   pnpm dev
   ```

2. Go to Documents page → Upload a PDF

3. Check AWS S3 console → Your file should appear in `users/{userId}/{documentType}/`

## File Structure in S3

Files are organized as:
```
users/
  └── {userId}/
      ├── invoice/
      │   └── timestamp-random-filename.pdf
      ├── receipt/
      │   └── timestamp-random-filename.jpg
      └── contract/
          └── timestamp-random-filename.pdf
```

## Security Considerations

1. **Never expose AWS credentials in client-side code**
2. **Use pre-signed URLs** for temporary access (1 hour default)
3. **Validate file types** server-side (PDF, images only)
4. **Limit file sizes** (10MB max per file by default)
5. **Block public access** to the bucket
6. **Use HTTPS** in production

## Alternative S3-Compatible Services

### MinIO (Self-hosted)
```env
S3_ENDPOINT=https://minio.yourdomain.com
S3_FORCE_PATH_STYLE=true
AWS_REGION=us-east-1
```

### Wasabi
```env
S3_ENDPOINT=https://s3.wasabisys.com
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket
```

### DigitalOcean Spaces
```env
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
AWS_REGION=nyc3
S3_FORCE_PATH_STYLE=false
```

## Troubleshooting

### CORS Errors
- Verify CORS settings in S3 bucket permissions
- Ensure origin matches exactly (http vs https, port numbers)

### Upload Fails
- Check IAM user permissions
- Verify environment variables are loaded
- Check file size limits (10MB default)

### Access Denied
- Ensure IAM policy includes `s3:PutObject` and `s3:GetObject`
- Verify bucket name in environment variables

## Next Steps

1. Add file type validation UI
2. Implement drag-and-drop upload zone
3. Add upload progress indicators
4. Enable image previews before upload
5. Add file versioning for important documents
