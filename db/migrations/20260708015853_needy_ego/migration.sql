ALTER TYPE "public"."member_status" ADD VALUE 'pending';
--> statement-breakpoint
UPDATE "members"
SET "sex" = CASE
	WHEN lower(trim("sex")) IN ('masculino', 'm', 'male') THEN 'Masculino'
	WHEN lower(trim("sex")) IN ('feminino', 'f', 'female') THEN 'Feminino'
	ELSE nullif(trim("sex"), '')
END
WHERE "sex" IS NOT NULL;
--> statement-breakpoint
UPDATE "members"
SET "marital_status" = CASE
	WHEN lower(trim("marital_status")) IN ('solteiro', 'solteira', 'solteiro(a)') THEN 'Solteiro(a)'
	WHEN lower(trim("marital_status")) IN ('casado', 'casada', 'casado(a)') THEN 'Casado(a)'
	WHEN lower(trim("marital_status")) IN ('viuvo', 'viúva', 'viúvo', 'viuvo(a)', 'viúvo(a)') THEN 'Viúvo(a)'
	WHEN lower(trim("marital_status")) IN ('divorciado', 'divorciada', 'divorciado(a)') THEN 'Divorciado(a)'
	WHEN lower(trim("marital_status")) IN ('uniao estavel', 'união estável', 'união estavel') THEN 'União estável'
	ELSE nullif(trim("marital_status"), '')
END
WHERE "marital_status" IS NOT NULL;
